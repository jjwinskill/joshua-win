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

  // The open panel is bigger than one at the back.
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

const lit = (page: Page) =>
  page
    .locator('.umbrella-panel')
    .evaluateAll((panels) =>
      panels.map((panel) => (panel as HTMLElement).style.getPropertyValue('--lit')),
    );
const allLit = Array.from({ length: 9 }, () => '1');

/** Puts the top of the umbrella this far up from the bottom of the screen, and waits for it to hydrate. */
async function peek(page: Page, pixels: number) {
  await page.locator('.umbrella').evaluate((umbrella, up) => {
    const y = umbrella.getBoundingClientRect().top + scrollY - innerHeight + up;
    scrollTo({ top: y, behavior: 'instant' });
  }, pixels);
  await expect
    .poll(() =>
      page
        .locator('.umbrella-panel')
        .first()
        .evaluate((panel) => (panel as HTMLElement).style.getPropertyValue('--open')),
    )
    .toBe('0.000');
}

test('it stays folded while it only peeks in, and launches when it comes into view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(writeUp);
  await peek(page, 60);
  await page.waitForTimeout(300);
  expect(await lit(page)).toEqual(Array.from({ length: 9 }, () => '0'));

  await page.locator('.umbrella').evaluate((umbrella) => {
    umbrella.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await expect.poll(() => lit(page)).toEqual(allLit);
  await expect.poll(() => openness(page)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
  const right = await page
    .locator('.umbrella-panel')
    .evaluateAll((panels) =>
      Math.max(...panels.map((panel) => panel.getBoundingClientRect().right)),
    );
  expect(right).toBeLessThanOrEqual(390);
});

test('a screen too short to show most of it still launches it', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 240 });
  await page.goto(writeUp);
  await page.locator('.umbrella').evaluate((umbrella) => {
    scrollTo({ top: umbrella.getBoundingClientRect().top + scrollY, behavior: 'instant' });
  });
  await expect.poll(() => lit(page)).toEqual(allLit);
});

test('focusing a panel’s button launches it, so focus never lands on nothing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(writeUp);
  await peek(page, 60);
  await page
    .getByRole('button', { name: 'Agent A' })
    .evaluate((button) => (button as HTMLElement).focus({ preventScroll: true }));
  await expect.poll(() => lit(page)).toEqual(allLit);
});

test('dragging sideways turns the ring, and doesn’t count as a tap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(writeUp);
  await page.locator('.umbrella').evaluate((umbrella) => {
    umbrella.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await expect.poll(() => lit(page)).toEqual(allLit);
  const box = await page.locator('.umbrella').boundingBox();
  const y = (box?.y ?? 0) + (box?.height ?? 0) * 0.75;
  const middle = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const drag = async (by: number) => {
    await page.mouse.move(middle, y);
    await page.mouse.down();
    await page.mouse.move(middle + by / 2, y, { steps: 4 });
    await page.mouse.move(middle + by, y, { steps: 4 });
    // Hold still, so that this isn't a flick.
    await page.waitForTimeout(150);
    await page.mouse.up();
  };
  // A quarter of its width to the left brings on the next panel, which starts on the right.
  await drag(-(box?.width ?? 0) * 0.25);
  await expect(page.getByRole('button', { name: 'Agent B', pressed: true })).toHaveCount(1);
  await expect.poll(() => openness(page)).toEqual([0, 1, 0, 0, 0, 0, 0, 0, 0]);
  // And the other way, past the first and round to the last.
  await drag((box?.width ?? 0) * 0.5);
  await expect(page.getByRole('button', { name: 'Agent F', pressed: true })).toHaveCount(1);
  await expect.poll(() => openness(page)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 1]);
  await expect(page.locator('.umbrella')).toHaveCSS('touch-action', 'pan-y pinch-zoom');
});

test('a tap that slips a little still taps', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(writeUp);
  await page.locator('.umbrella').evaluate((umbrella) => {
    umbrella.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await expect.poll(() => lit(page)).toEqual(allLit);
  const box = await page.getByRole('button', { name: 'Agent B' }).boundingBox();
  const x = (box?.x ?? 0) + (box?.width ?? 0) / 2;
  const y = (box?.y ?? 0) + (box?.height ?? 0) / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 8, y);
  await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Agent B', pressed: true })).toHaveCount(1);
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true });

  test('a swipe up scrolls the page and leaves the ring alone, even with some drift', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(writeUp);
    await page.locator('.umbrella').evaluate((umbrella) => {
      umbrella.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    await expect.poll(() => lit(page)).toEqual(allLit);
    const before = await page.evaluate(() => scrollY);
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x?: number, y?: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: x === undefined ? [] : [{ x, y: y ?? 0 }],
      });
    let x = 120;
    let y = 600;
    await touch('touchStart', x, y);
    for (let i = 0; i < 20; i += 1) {
      x += 4;
      y -= 14;
      await touch('touchMove', x, y);
    }
    await touch('touchEnd');
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
    await expect(page.getByRole('button', { name: 'Agent A', pressed: true })).toHaveCount(1);
    await expect.poll(() => openness(page)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
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
