import { expect, test } from '@playwright/test';
import { limitsFor } from './limits';
import {
  readMetrics,
  readTransition,
  waitForInteractions,
  report,
  resetFrames,
  swipeToBottom,
  throttledPage,
} from './measure';

// Throttled checks of what Lighthouse can't see (S1): scrolling, interaction and transitions (#33).
const essay = 'essays/lorem-ipsum/';
const scrolled = [essay];

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
