import { expect, test, type Page } from '@playwright/test';

// The heavy page, the performance canary (#34).
const heavy = 'essays/amet-consectetur/';

const scrollTo = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => {
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' });
  });

test('its own card on the home page leads to it', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: /Amet consectetur/ }).click();
  await expect(page).toHaveURL(/essays\/amet-consectetur\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Amet consectetur' })).toBeVisible();
});

test('the newest piece comes first on the home page', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.piece-card h2').first()).toHaveText('Amet consectetur');
});

test('three.js and the chart wait until the reader is near them', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.setViewportSize({ width: 412, height: 400 });
  await page.goto(heavy);
  await page.waitForLoadState('networkidle');
  const threeLoaded = () => requests.filter((url) => /sceneRenderer/.test(url)).length;
  expect(threeLoaded()).toBe(0);
  await expect(page.locator('.heavy-chart circle')).toHaveCount(0);

  await scrollTo(page, '.heavy-scene');
  await expect(page.locator('.heavy-scene canvas')).toHaveAttribute('data-loaded', 'true');
  expect(threeLoaded()).toBeGreaterThan(0);

  await scrollTo(page, '.heavy-chart');
  await expect(page.locator('.heavy-chart circle')).toHaveCount(2000);
});

test('the scene runs only on screen, and can be paused', async ({ page }) => {
  await page.goto(heavy);
  const canvas = page.locator('.heavy-scene canvas');
  await scrollTo(page, '.heavy-scene');
  await expect(canvas).toHaveAttribute('data-running', 'true');

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(canvas).toHaveAttribute('data-running', 'false');

  await scrollTo(page, '.heavy-scene');
  await expect(canvas).toHaveAttribute('data-running', 'true');
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(canvas).toHaveAttribute('data-running', 'false');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-running', 'true');
});

test('scrubbing the chart moves its points and tells a screen reader', async ({ page }) => {
  await page.goto(heavy);
  await scrollTo(page, '.heavy-chart');
  const point = page.locator('.heavy-chart circle').nth(100);
  await expect(point).toBeAttached();
  const before = await point.getAttribute('cy');
  await page.getByRole('slider').fill('70');
  await expect(point).not.toHaveAttribute('cy', before ?? '');
  await expect(page.locator('[aria-live="polite"]')).toContainText('Step 70 of 100');
});

test.describe('under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the scene draws a still frame, with no pause button to need', async ({ page }) => {
    await page.goto(heavy);
    const canvas = page.locator('.heavy-scene canvas');
    await scrollTo(page, '.heavy-scene');
    await expect(canvas).toHaveAttribute('data-loaded', 'true');
    await expect(canvas).toHaveAttribute('data-running', 'false');
    await expect(page.getByRole('button', { name: 'Pause' })).toBeHidden();
  });
});
