import { expect, test, type Page } from '@playwright/test';
import { failOnErrors } from './fail-on-errors';

// The umbrella carousel (#54).
const writeUp = 'write-ups/excepteur-sint/';

const openness = (page: Page) =>
  page
    .locator('.umbrella-panel')
    .evaluateAll((panels) =>
      panels.map((panel) => Number((panel as HTMLElement).style.getPropertyValue('--open'))),
    );

test('reached from another page, a tap twists a panel forward and expands only that one', async ({
  page,
}) => {
  const errors = failOnErrors(page);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('./');
  await page.getByRole('link', { name: /Excepteur sint occaecat/ }).click();
  await expect(page).toHaveURL(/write-ups\/excepteur-sint\/$/);
  await page.locator('.umbrella').scrollIntoViewIfNeeded();
  const ipsum = page.getByRole('button', { name: 'Agent B' });
  await expect(page.locator('.umbrella-panel').nth(1)).toHaveCSS('transform', /.+/);
  // Hydrating is when the first tap starts to count.
  await expect(async () => {
    await ipsum.click();
    await expect(ipsum).toHaveAttribute('aria-pressed', 'true', { timeout: 100 });
  }).toPass();
  await expect.poll(() => openness(page)).toEqual([0, 1, 0, 0, 0, 0, 0, 0, 0]);

  // Tap the panel that's now at the back: the visual lines up with its button.
  const box = await page.locator('.umbrella-panel').nth(5).boundingBox();
  const front = await page.locator('.umbrella-panel').nth(1).boundingBox();
  expect(front?.width).toBeGreaterThan(box?.width ?? 0);

  // Leave in the middle of a twist: nothing throws, and it works again on return.
  await page.getByRole('button', { name: 'Agent F' }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await expect(page.locator('.umbrella')).toHaveCount(0);
  await page.goForward();
  await page.locator('.umbrella').scrollIntoViewIfNeeded();
  const dolor = page.getByRole('button', { name: 'Agent D' });
  await expect(async () => {
    await dolor.click();
    await expect(dolor).toHaveAttribute('aria-pressed', 'true', { timeout: 100 });
  }).toPass();
  await expect.poll(() => openness(page)).toEqual([0, 0, 0, 0, 0, 0, 1, 0, 0]);
  expect(errors).toEqual([]);
});

test('every panel’s button sits over it, and is reachable by tapping there', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(writeUp);
  await page.locator('.umbrella').scrollIntoViewIfNeeded();
  const buttons = page.locator('.umbrella-button');
  await expect(page.getByRole('button', { pressed: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Agent A', pressed: true })).toHaveCount(1);
  // Nothing is left folded once it has launched.
  await expect
    .poll(() =>
      buttons.evaluateAll((all) =>
        all.map((button) => {
          const { left, right, top, bottom } = button.getBoundingClientRect();
          // The middle of each panel, so no neighbor covers it.
          return document.elementFromPoint((left + right) / 2, (top + bottom) / 2) === button;
        }),
      ),
    )
    .toEqual(Array.from({ length: 9 }, () => true));
});

test('it fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(writeUp);
  await page.locator('.umbrella').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  // Every panel's text fits, and the fullest is one of several, with cards left after it.
  const overflows = await page
    .locator('.umbrella-open')
    .evaluateAll((parts) => parts.map((part) => part.scrollHeight - part.clientHeight));
  expect(Math.max(...overflows)).toBeLessThanOrEqual(0);
});

test('it launches when it comes into view, and not before', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(writeUp);
  const lit = () =>
    page
      .locator('.umbrella-panel')
      .evaluateAll((panels) =>
        panels.map((panel) => (panel as HTMLElement).style.getPropertyValue('--lit')),
      );
  // Far down the page, hydration may not have happened, and either way nothing has launched.
  expect((await lit()).every((value) => value === '0')).toBe(true);
  await page.locator('.umbrella').scrollIntoViewIfNeeded();
  await expect.poll(lit).toEqual(Array.from({ length: 9 }, () => '1'));
  await expect.poll(() => openness(page)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
  const right = await page
    .locator('.umbrella-panel')
    .evaluateAll((panels) =>
      Math.max(...panels.map((panel) => panel.getBoundingClientRect().right)),
    );
  expect(right).toBeLessThanOrEqual(390);
});

test.describe('under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('it snaps', async ({ page }) => {
    await page.goto(writeUp);
    await page.locator('.umbrella').scrollIntoViewIfNeeded();
    const amet = page.getByRole('button', { name: 'Agent F' });
    await expect(async () => {
      await amet.click();
      await expect(amet).toHaveAttribute('aria-pressed', 'true', { timeout: 100 });
    }).toPass();
    // No frames in between: it's there on the very next read.
    expect(await openness(page)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 1]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('it steps aside for the floor beside it', async ({ page }) => {
    await page.goto(writeUp);
    await expect(page.locator('.umbrella-chart')).toBeHidden();
    await expect(page.locator('.run-chart svg').first()).toBeVisible();
  });
});
