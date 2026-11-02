import { expect, test, type Page } from '@playwright/test';
import { failOnErrors } from './fail-on-errors';

// The scroll-driven robot (#55): CSS only, on a view() timeline.
const writeUp = 'write-ups/excepteur-sint/';

/** Scrolls to a point in the robot's run, from 0 (just pinned) to 1 (about to let go). */
async function scrollThrough(page: Page, progress: number) {
  return page.evaluate((at) => {
    const track = document.querySelector('.robot-track') as HTMLElement;
    const top = track.getBoundingClientRect().top + scrollY;
    const y = Math.round(top + at * (track.offsetHeight - innerHeight));
    scrollTo({ top: y, behavior: 'instant' });
    return y;
  }, progress);
}

const opacityOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((part) => Number(getComputedStyle(part).opacity));

const rotationOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((part) => {
    const { a, b } = new DOMMatrix(getComputedStyle(part).transform);
    return Math.round((Math.atan2(b, a) * 180) / Math.PI);
  });

test('reached from another page, scrolling opens, catches, snaps shut and switches on', async ({
  page,
}) => {
  const errors = failOnErrors(page);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('./');
  await page.getByRole('link', { name: /Excepteur sint occaecat/ }).click();
  await expect(page).toHaveURL(/write-ups\/excepteur-sint\/$/);

  // It's waiting: lid open, face off, no brain in sight.
  await scrollThrough(page, 0);
  await expect.poll(() => rotationOf(page, '.robot-lid')).toBeGreaterThan(100);
  expect(await opacityOf(page, '.robot-face-on')).toBe(0);
  const brain = await page.locator('.robot-brain path').first().boundingBox();
  expect((brain?.y ?? 0) + (brain?.height ?? 0)).toBeLessThan(0);

  // The brain's in, and the lid hasn't shut yet.
  await scrollThrough(page, 0.47);
  await expect.poll(() => rotationOf(page, '.robot-lid')).toBeGreaterThan(100);
  expect(await opacityOf(page, '.robot-face-on')).toBe(0);

  // The end: shut, and on.
  await scrollThrough(page, 1);
  await expect.poll(() => rotationOf(page, '.robot-lid')).toBe(0);
  expect(await opacityOf(page, '.robot-face-on')).toBe(1);
  for (const lamp of await page.locator('.robot-lamp').all()) {
    await expect(lamp).toHaveCSS('opacity', '1');
  }

  // Scrolling back runs it backward.
  await scrollThrough(page, 0);
  await expect.poll(() => rotationOf(page, '.robot-lid')).toBeGreaterThan(100);
  expect(errors).toEqual([]);
});

test('it leaves the page’s scrolling alone, and holds still while it plays', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(writeUp);
  const stageTop = () =>
    page.locator('.robot-stage').evaluate((stage) => stage.getBoundingClientRect().top);
  for (const at of [0, 0.5, 1]) {
    const y = await scrollThrough(page, at);
    expect(await page.evaluate(() => scrollY)).toBe(y);
    expect(Math.abs(await stageTop())).toBeLessThan(1);
  }
  // Past the end, the stage scrolls away with the page.
  await page.evaluate(() => scrollBy({ top: 300, behavior: 'instant' }));
  expect(await stageTop()).toBeLessThan(0);
});

test('it fits a phone, even with the lid open', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(writeUp);
  await scrollThrough(page, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  const robot = await page.locator('.robot').boundingBox();
  const caption = await page.locator('.robot-stage figcaption').boundingBox();
  expect((caption?.y ?? 0) + (caption?.height ?? 0)).toBeLessThanOrEqual(568);
  expect(robot?.y).toBeGreaterThanOrEqual(0);
});

test.describe('under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('it’s the finished robot in the page’s flow, with nothing running', async ({ page }) => {
    await page.goto(writeUp);
    await page.locator('.robot').scrollIntoViewIfNeeded();
    expect(await rotationOf(page, '.robot-lid')).toBe(0);
    expect(await opacityOf(page, '.robot-face-on')).toBe(1);
    await expect(page.locator('.robot-stage')).toHaveCSS('position', 'static');
    const running = await page
      .locator('.robot')
      .evaluate((robot) => robot.getAnimations({ subtree: true }).length);
    expect(running).toBe(0);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the robot and its caption are there', async ({ page }) => {
    await page.goto(writeUp);
    await expect(page.locator('.robot svg').first()).toBeAttached();
    await expect(page.locator('.robot-stage figcaption')).toBeVisible();
  });
});
