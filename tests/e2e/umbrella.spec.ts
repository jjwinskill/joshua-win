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
  const ipsum = page.getByRole('button', { name: 'Ipsum' });
  await expect(page.locator('.umbrella-panel').nth(1)).toHaveCSS('transform', /.+/);
  // Hydrating is when the first tap starts to count.
  await expect(async () => {
    await ipsum.click();
    await expect(ipsum).toHaveAttribute('aria-pressed', 'true', { timeout: 100 });
  }).toPass();
  await expect.poll(() => openness(page)).toEqual([0, 1, 0, 0]);

  // Tap the panel that's now at the back: the visual lines up with its button.
  const box = await page.locator('.umbrella-panel').nth(3).boundingBox();
  const front = await page.locator('.umbrella-panel').nth(1).boundingBox();
  expect(front?.width).toBeGreaterThan(box?.width ?? 0);

  // Leave in the middle of a twist: nothing throws, and it works again on return.
  await page.getByRole('button', { name: 'Amet' }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await expect(page.locator('.umbrella')).toHaveCount(0);
  await page.goForward();
  await page.locator('.umbrella').scrollIntoViewIfNeeded();
  const dolor = page.getByRole('button', { name: 'Dolor' });
  await expect(async () => {
    await dolor.click();
    await expect(dolor).toHaveAttribute('aria-pressed', 'true', { timeout: 100 });
  }).toPass();
  await expect.poll(() => openness(page)).toEqual([0, 0, 1, 0]);
  expect(errors).toEqual([]);
});

test('every panel’s button sits over it, and is reachable by tapping there', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(writeUp);
  await page.locator('.umbrella').scrollIntoViewIfNeeded();
  const buttons = page.locator('.umbrella-button');
  for (const name of ['Ipsum', 'Dolor', 'Amet', 'Lorem']) {
    await expect(page.getByRole('button', { name, pressed: true })).toHaveCount(
      name === 'Lorem' ? 1 : 0,
    );
  }
  const hits = await buttons.evaluateAll((all) =>
    all.map((button) => {
      const { left, right, top } = button.getBoundingClientRect();
      // Near the top middle of each panel, which is what shows of a panel at the back.
      const hit = document.elementFromPoint((left + right) / 2, top + 16);
      return hit === button;
    }),
  );
  expect(hits).toEqual([true, true, true, true]);
});

test('it fits a phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(writeUp);
  await page.locator('.umbrella').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  const open = page.locator('.umbrella-open').first();
  const overflow = await open.evaluate((part) => part.scrollHeight - part.clientHeight);
  expect(overflow).toBeLessThanOrEqual(0);
});

test.describe('under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('it snaps', async ({ page }) => {
    await page.goto(writeUp);
    await page.locator('.umbrella').scrollIntoViewIfNeeded();
    const amet = page.getByRole('button', { name: 'Amet' });
    await expect(async () => {
      await amet.click();
      await expect(amet).toHaveAttribute('aria-pressed', 'true', { timeout: 100 });
    }).toPass();
    // No frames in between: it's there on the very next read.
    expect(await openness(page)).toEqual([0, 0, 0, 1]);
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
