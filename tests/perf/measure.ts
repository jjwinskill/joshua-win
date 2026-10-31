import { appendFile, mkdir } from 'node:fs/promises';
import type { BrowserContext, Page } from '@playwright/test';

// What the throttled checks measure, and where they write it. Everything in the browser goes through
// installRecorder, which works on any page, in Astro or Next.

export interface Metrics {
  cls: number;
  inp: number;
  longFrames: number;
  blockingMs: number;
  frameP95: number;
  frameWorst: number;
}

export interface TransitionResult {
  ran: boolean;
  morphed: boolean;
  // Null when no transition was recorded, so that it can't read as a fast one.
  tapToFinishMs: number | null;
  frames: number | null;
  worstFrame: number | null;
}

declare global {
  interface Window {
    perf: {
      layoutShift: number;
      interaction: number;
      interactions: Set<number>;
      longFrames: number;
      blockingMs: number;
      frames: number[];
    };
  }
}

// Runs before each page's own scripts. Transition results go in sessionStorage to survive the move to
// a new document.
function installRecorder() {
  const perf = {
    layoutShift: 0,
    interaction: 0,
    interactions: new Set<number>(),
    longFrames: 0,
    blockingMs: 0,
    frames: [] as number[],
  };
  window.perf = perf;

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as (PerformanceEntry & {
      value: number;
      hadRecentInput: boolean;
    })[]) {
      if (!entry.hadRecentInput) perf.layoutShift += entry.value;
    }
  }).observe({ type: 'layout-shift', buffered: true });

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as (PerformanceEntry & { interactionId: number })[]) {
      if (!entry.interactionId) continue;
      perf.interactions.add(entry.interactionId);
      perf.interaction = Math.max(perf.interaction, entry.duration);
    }
  }).observe({ type: 'event', durationThreshold: 16, buffered: true } as PerformanceObserverInit);

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as (PerformanceEntry & { blockingDuration: number })[]) {
      perf.longFrames += 1;
      perf.blockingMs += entry.blockingDuration;
    }
  }).observe({ type: 'long-animation-frame', buffered: true });

  let last = performance.now();
  const tick = (now: number) => {
    perf.frames.push(now - last);
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  addEventListener(
    'click',
    () => {
      sessionStorage.removeItem('perf-transition');
      sessionStorage.setItem('perf-tap', String(performance.timeOrigin + performance.now()));
    },
    true,
  );

  const watchTransition = (transition: ViewTransition) => {
    const frames: number[] = [];
    let previous = performance.now();
    let running = true;
    let morphed = false;
    const frame = (now: number) => {
      frames.push(now - previous);
      previous = now;
      morphed ||= document.documentElement
        .getAnimations({ subtree: true })
        .some((animation) =>
          (animation.effect as KeyframeEffect | null)?.pseudoElement?.includes(
            'view-transition-group(piece-',
          ),
        );
      if (running) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    // finished still fulfils for a skipped transition. Only ready tells them apart.
    let ran = false;
    transition.ready.then(
      () => {
        ran = true;
      },
      () => undefined,
    );
    void transition.finished.then(() => {
      running = false;
      const tap = Number(sessionStorage.getItem('perf-tap'));
      sessionStorage.setItem(
        'perf-transition',
        JSON.stringify({
          ran,
          morphed,
          tapToFinishMs: performance.timeOrigin + performance.now() - tap,
          frames: frames.length,
          worstFrame: Math.max(0, ...frames),
        }),
      );
    });
  };

  // Cross-document transitions (Astro) arrive on pagereveal.
  addEventListener('pagereveal', (event) => {
    const { viewTransition } = event as PageRevealEvent;
    if (viewTransition) watchTransition(viewTransition);
  });
  // Same-document transitions (Next, through React) call this.
  const start = document.startViewTransition?.bind(document);
  if (start) {
    document.startViewTransition = ((...args: Parameters<typeof start>) => {
      const transition = start(...args);
      watchTransition(transition);
      return transition;
    }) as typeof document.startViewTransition;
  }
}

export async function throttledPage(context: BrowserContext): Promise<Page> {
  await context.addInitScript(installRecorder);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  return page;
}

// A slow interaction is reported only after its next paint. Waiting for it means a slow one can't be
// missed, and an interaction that was never measured fails here rather than reading as 0.
export async function waitForInteractions(page: Page, count: number): Promise<void> {
  await page.waitForFunction((n) => window.perf.interactions.size >= n, count, { timeout: 10_000 });
}

export async function readMetrics(page: Page): Promise<Metrics> {
  // A short grace, so the observers have delivered their last entries.
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const { layoutShift, interaction, longFrames, blockingMs, frames } = window.perf;
    const sorted = [...frames].sort((a, b) => a - b);
    return {
      cls: layoutShift,
      inp: interaction,
      longFrames,
      blockingMs,
      frameP95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
      frameWorst: sorted.at(-1) ?? 0,
    };
  });
}

// Starts frame and long-frame counts afresh, so they cover what's measured and not the page's load.
// CLS isn't reset: a shift during load counts.
export function resetFrames(page: Page): Promise<void> {
  return page.evaluate(() => {
    window.perf.frames.length = 0;
    window.perf.longFrames = 0;
    window.perf.blockingMs = 0;
  });
}

export async function swipeToBottom(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  const distance = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await cdp.send('Input.synthesizeScrollGesture', {
    x: 200,
    y: 500,
    yDistance: -distance,
    speed: 1600,
    gestureSourceType: 'touch',
  });
}

// For a transition that may not run: waits for the destination's heading, then for anything animating to
// finish, so a late transition isn't reported as a lost one.
export async function settledTransition(
  page: Page,
  heading: string | RegExp,
): Promise<TransitionResult> {
  await page.getByRole('heading', { level: 1, name: heading }).waitFor({ timeout: 10_000 });
  await page.waitForTimeout(300);
  await page.waitForFunction(
    () =>
      !document.documentElement
        .getAnimations({ subtree: true })
        .some((animation) =>
          (animation.effect as KeyframeEffect | null)?.pseudoElement?.includes('view-transition'),
        ),
    undefined,
    { timeout: 10_000 },
  );
  // The result is written when the transition's finished promise settles.
  await page.waitForTimeout(100);
  return readTransition(page);
}

export function readTransition(page: Page): Promise<TransitionResult> {
  return page.evaluate(
    () =>
      JSON.parse(
        sessionStorage.getItem('perf-transition') ??
          '{"ran":false,"morphed":false,"tapToFinishMs":null,"frames":null,"worstFrame":null}',
      ) as TransitionResult,
  );
}

const resultsDir = 'perf-results';

// One JSON line per measurement, marked with its run and target so that builds can't be confused. CI
// keeps the file, and the bake-off report reads it.
export async function report(check: string, route: string, values: object): Promise<void> {
  await mkdir(resultsDir, { recursive: true });
  const line = JSON.stringify({
    run: process.env.PERF_RUN,
    target: process.env.PERF_BASE_URL ?? 'local',
    check,
    route,
    ...values,
  });
  await appendFile(`${resultsDir}/results.jsonl`, `${line}\n`);
}
