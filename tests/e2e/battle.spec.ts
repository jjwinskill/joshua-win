import { expect, test, type Page } from '@playwright/test';
import { failOnErrors } from './fail-on-errors';

// The pixel-art battle (#56).
const writeUp = 'write-ups/excepteur-sint/';

const drawing = (page: Page) =>
  page
    .locator('.battle-screen')
    .evaluate((svg) =>
      [...svg.querySelectorAll('path')].map((path) => path.getAttribute('d')).join(),
    );

test('reached from another page it plays, and leaving stops its timer', async ({
  context,
  page,
}) => {
  await context.addInitScript(() => {
    const live = new Set<unknown>();
    (window as unknown as { liveTimers: typeof live }).liveTimers = live;
    const set = window.setInterval.bind(window);
    const clear = window.clearInterval.bind(window);
    window.setInterval = ((...args: Parameters<typeof set>) => {
      const id = set(...args);
      live.add(id);
      return id;
    }) as typeof window.setInterval;
    window.clearInterval = ((id: number) => {
      live.delete(id);
      clear(id);
    }) as typeof window.clearInterval;
  });
  const timers = () =>
    page.evaluate(() => (window as unknown as { liveTimers: Set<unknown> }).liveTimers.size);
  const errors = failOnErrors(page);
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => {
    (window as unknown as { sameDocument: boolean }).sameDocument = true;
  });
  const before = await timers();

  await page.getByRole('link', { name: /Excepteur sint occaecat/ }).click();
  await expect(page).toHaveURL(/write-ups\/excepteur-sint\/$/);
  await page.locator('.battle-screen').scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  const early = await drawing(page);
  await expect.poll(() => drawing(page)).not.toBe(early);
  expect(await timers()).toBe(before + 1);

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await expect(page.locator('.battle-screen')).toHaveCount(0);
  await expect.poll(timers).toBe(before);

  await page.goForward();
  await page.locator('.battle-screen').scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  expect(
    await page.evaluate(() => (window as unknown as { sameDocument?: boolean }).sameDocument),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('pause holds it, a tap on play resumes, and next round jumps ahead', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(writeUp);
  await page.locator('.battle-screen').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Pause' }).click();
  const paused = await drawing(page);
  await page.waitForTimeout(300);
  expect(await drawing(page)).toBe(paused);

  await page.getByRole('button', { name: 'Play' }).click();
  await expect.poll(() => drawing(page)).not.toBe(paused);

  await page.getByRole('button', { name: 'Next round' }).click();
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
});

test('its buttons are big enough to tap, and it fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(writeUp);
  await page.locator('.battle-screen').scrollIntoViewIfNeeded();
  const screen = await page.locator('.battle-screen').boundingBox();
  expect((screen?.x ?? 0) + (screen?.width ?? 0)).toBeLessThanOrEqual(320);
  const button = await page.getByRole('button', { name: 'Next round' }).boundingBox();
  expect(button?.height).toBeGreaterThanOrEqual(44);
});

test.describe('under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('it sits still on the menu, and the button snaps through the rounds', async ({ page }) => {
    await page.goto(writeUp);
    await page.locator('.battle-screen').scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Start over' })).toBeVisible();
    const still = await drawing(page);
    await page.waitForTimeout(300);
    expect(await drawing(page)).toBe(still);
    await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByRole('button', { name: 'Next round' })).toBeVisible();
    expect(await drawing(page)).not.toBe(still);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the menu’s there, and no dead buttons', async ({ page }) => {
    await page.goto(writeUp);
    await expect(page.locator('.battle-screen')).toBeVisible();
    expect(await page.locator('.battle-screen path').count()).toBeGreaterThan(0);
    await expect(page.locator('.battle-controls')).toBeHidden();
  });
});
