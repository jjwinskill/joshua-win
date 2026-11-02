import { expect, test, type Page } from '@playwright/test';
import { limitsFor } from './limits';
import {
  readMetrics,
  readTransition,
  settledTransition,
  waitForInteractions,
  report,
  resetFrames,
  swipeToBottom,
  throttledPage,
} from './measure';

// Throttled checks of what Lighthouse can't see (S1): scrolling, interaction and transitions (#33).
const essay = 'essays/lorem-ipsum/';
const heavy = 'essays/amet-consectetur/';
const mdx = 'essays/ut-labore/';
const writeUp = 'write-ups/excepteur-sint/';
const scrolled = [essay, heavy, mdx];

test.describe('scrolling', () => {
  for (const route of scrolled) {
    test(`${route} stays stable through a touch scroll`, async ({ context }) => {
      const page = await throttledPage(context);
      await page.goto(route);
      await expect(page.locator('.parade .fill')).toHaveAttribute('style', /scaleX/);
      await resetFrames(page);
      await swipeToBottom(page);
      const metrics = await readMetrics(page);
      // Nothing is tapped here, so an INP would mean nothing.
      await report('scroll', route, { ...metrics, inp: undefined });
      expect(metrics.cls, 'CLS').toBeLessThanOrEqual(limitsFor(route).cls);
    });
  }
});

test.describe('the write-up', () => {
  test('stays stable through a touch scroll, with no parade', async ({ context }) => {
    const page = await throttledPage(context);
    await page.goto(writeUp);
    await expect(page.locator('.run-chart svg').first()).toBeVisible();
    await resetFrames(page);
    await swipeToBottom(page);
    const metrics = await readMetrics(page);
    await report('scroll', writeUp, { ...metrics, inp: undefined });
    expect(metrics.cls, 'CLS').toBeLessThanOrEqual(limitsFor(writeUp).cls);
  });

  test('its card transition runs', async ({ context }) => {
    const page = await throttledPage(context);
    await page.goto('./');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: /Excepteur sint occaecat/ }).tap();
    const result = await settledTransition(page, /Excepteur sint occaecat/);
    await report('transition-write-up', writeUp, result);
    expect(result.morphed).toBe(true);
  });
});

test.describe('interaction', () => {
  test('tapping a parade dot responds in time', async ({ context }) => {
    const page = await throttledPage(context);
    await page.goto(essay);
    await expect(page.locator('.parade .fill')).toHaveAttribute('style', /scaleX/);
    await page.getByRole('button', { name: /The Cheshire Cat/ }).tap();
    await expect(page.locator('#cast-cat')).toHaveClass(/flash/);
    await waitForInteractions(page, 1);
    const metrics = await readMetrics(page);
    await report('interaction', essay, metrics);
    expect(metrics.inp, 'INP').toBeLessThanOrEqual(limitsFor(essay).inp);
    expect(metrics.cls, 'CLS').toBeLessThanOrEqual(limitsFor(essay).cls);
  });
});

test.describe('piece 3', () => {
  test('its one-off hydrates without shifting the page', async ({ context }) => {
    const page = await throttledPage(context);
    await page.goto(mdx);
    await expect(page.locator('.scroll-tally')).toHaveText(/%$/);
    await page.waitForTimeout(500);
    const metrics = await readMetrics(page);
    await report('one-off', mdx, { ...metrics, inp: undefined });
    expect(metrics.cls, 'CLS').toBeLessThanOrEqual(limitsFor(mdx).cls);
  });
});

test.describe('the heavy page', () => {
  test('scrubbing the chart responds in time at each step', async ({ context }) => {
    const page = await throttledPage(context);
    await page.goto(heavy);
    await page.locator('.heavy-chart').scrollIntoViewIfNeeded();
    await expect(page.locator('.heavy-chart circle')).toHaveCount(2000);
    const slider = page.getByRole('slider');
    for (const x of [60, 140, 220, 300, 340]) {
      const before = await slider.inputValue();
      await slider.tap({ position: { x, y: 20 } });
      await expect(slider).not.toHaveValue(before);
    }
    await waitForInteractions(page, 5);
    const metrics = await readMetrics(page);
    await report('scrub', heavy, metrics);
    expect(metrics.inp, 'INP').toBeLessThanOrEqual(limitsFor(heavy).inp);
    expect(metrics.cls, 'CLS').toBeLessThanOrEqual(limitsFor(heavy).cls);
  });

  test('the scene loads and runs without shifting the page', async ({ context }) => {
    const page = await throttledPage(context);
    await page.goto(heavy);
    await page.locator('.heavy-scene').scrollIntoViewIfNeeded();
    await expect(page.locator('.heavy-scene canvas')).toHaveAttribute('data-running', 'true');
    await resetFrames(page);
    await page.waitForTimeout(1500);
    const metrics = await readMetrics(page);
    await report('scene', heavy, metrics);
    expect(metrics.cls, 'CLS').toBeLessThanOrEqual(limitsFor(heavy).cls);
  });
});

test.describe('the card transition', () => {
  async function tapCard(context: Parameters<typeof throttledPage>[0], warm: boolean) {
    const page = await throttledPage(context);
    if (warm) {
      await page.goto(essay);
      await page.waitForLoadState('networkidle');
    }
    await page.goto('./');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: /Lorem ipsum dolor/ }).tap();
    return finishedTransition(page);
  }

  async function finishedTransition(page: Page) {
    await page.waitForURL(`**/${essay}`);
    await expect
      .poll(() => readTransition(page).then((result) => result.ran), { timeout: 10_000 })
      .toBe(true);
    return readTransition(page);
  }

  test('runs from a cold navigation', async ({ context }) => {
    const result = await tapCard(context, false);
    await report('transition-cold', essay, result);
    expect(result.morphed).toBe(true);
  });

  test('runs from a warm navigation', async ({ context }) => {
    const result = await tapCard(context, true);
    await report('transition-warm', essay, result);
    expect(result.morphed).toBe(true);
  });

  // The cold check waits for a quiet network, which lets a prefetching framework finish first. A reader
  // taps as soon as they see the card. Reported only: a framework may lose the morph here.
  test('is reported when the card is tapped as soon as it appears', async ({ context }) => {
    const page = await throttledPage(context);
    await page.goto('./', { waitUntil: 'commit' });
    await page.getByRole('link', { name: /Lorem ipsum dolor/ }).tap();
    await report('transition-immediate', essay, await settledTransition(page, /Lorem ipsum dolor/));
  });

  // Reported only: whether browser back morphs is part of the bake-off's findings, not a limit.
  test('is reported on browser back', async ({ context }) => {
    const page = await throttledPage(context);
    await page.goto('./');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: /Lorem ipsum dolor/ }).tap();
    await settledTransition(page, /Lorem ipsum dolor/);
    await page.evaluate(() => {
      sessionStorage.removeItem('perf-transition');
      sessionStorage.setItem('perf-tap', String(performance.timeOrigin + performance.now()));
    });
    await page.goBack();
    await report('transition-back', './', await settledTransition(page, 'Josh Winskill'));
  });
});

// The instruments themselves: a page that's slow on purpose must read as slow.
test('a deliberately slow page goes over the limits', async ({ context }) => {
  const page = await throttledPage(context);
  await page.route('**/slow-page', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><meta name="viewport" content="width=device-width">
        <div id="box" style="height:300px;background:#ccc"></div>
        <button id="slow" style="height:60px;width:200px">Slow</button>
        <p style="height:2000px">Tall</p>
        <script>
          setTimeout(() => { document.getElementById('box').style.height = '600px'; }, 800);
          document.getElementById('slow').addEventListener('click', () => {
            const end = performance.now() + 400;
            while (performance.now() < end);
          });
        </script>`,
    }),
  );
  await page.goto('slow-page');
  // After the first paint, or the shift doesn't count.
  await page.waitForTimeout(1200);
  await page.locator('#slow').tap();
  await waitForInteractions(page, 1);
  const metrics = await readMetrics(page);
  const limits = limitsFor('slow-page');
  expect(metrics.inp, 'INP on the slow page').toBeGreaterThan(limits.inp);
  expect(metrics.cls, 'CLS on the slow page').toBeGreaterThan(limits.cls);
  expect(metrics.longFrames, 'long frames on the slow page').toBeGreaterThan(0);
});
