import { expect, test, type Page } from '@playwright/test';

// The parade on piece 1, as a reader gets it (#31).
const essay = 'essays/lorem-ipsum/';

const parade = (page: Page) => page.getByRole('navigation', { name: /Reading progress/ });
const dot = (page: Page, name: RegExp) => parade(page).getByRole('button', { name });

async function waitForParade(page: Page) {
  await page.goto(essay);
  // It hydrates when the browser is idle, and the fill's transform is the first thing it sets.
  await expect(page.locator('.parade .fill')).toHaveAttribute('style', /scaleX/);
}

async function scrollTo(page: Page, selector: string) {
  await page.locator(selector).evaluate((el) => {
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 200, behavior: 'instant' });
  });
}

test('a cast member joins the line when the reader passes their first mention', async ({
  page,
}) => {
  await waitForParade(page);
  const rabbit = dot(page, /The White Rabbit/);
  await expect(rabbit).not.toHaveClass(/passed/);
  await scrollTo(page, '#cast-rabbit');
  await expect(rabbit).toHaveClass(/passed/);
  await expect(dot(page, /The Queen of Hearts/)).not.toHaveClass(/passed/);
});

test('a dot jumps to its first mention and highlights it', async ({ page }) => {
  await waitForParade(page);
  await dot(page, /The Queen of Hearts/).click();
  const mention = page.locator('#cast-queen');
  await expect(mention).toBeInViewport();
  await expect(mention).toHaveClass(/flash/);
});

test('hovering a dot peeks at the cast member', async ({ page }) => {
  await waitForParade(page);
  const queen = dot(page, /The Queen of Hearts/);
  await queen.hover();
  await expect(queen.locator('.label')).toHaveCSS('opacity', '1');
  await expect(queen.locator('.hop')).toHaveCSS('opacity', '0.85');
});

test('the curtain call gathers and bows the cast, walks them off and can replay', async ({
  page,
}) => {
  await waitForParade(page);
  await scrollTo(page, '#parade-end');
  const rabbit = dot(page, /The White Rabbit/);
  await expect(rabbit).toHaveClass(/walking/);
  await expect(rabbit).toHaveClass(/bow/, { timeout: 15_000 });
  await expect(rabbit).not.toHaveClass(/bow/, { timeout: 5_000 });

  // They've left the stage, and can't take focus while they're gone.
  await expect(page.locator('.slot[inert]')).toHaveCount(4, { timeout: 15_000 });

  const replay = page.getByRole('button', { name: 'Replay the curtain call' });
  await replay.focus();
  await page.keyboard.press('Enter');
  await expect(replay).toBeFocused();
  await expect(page.locator('.slot[inert]')).toHaveCount(0);
  await expect(rabbit).toHaveClass(/walking/);
});

test('replay walks the cast the full way, not a short hop', async ({ page }) => {
  await waitForParade(page);
  await scrollTo(page, '#parade-end');
  await expect(page.locator('.slot[inert]')).toHaveCount(4, { timeout: 15_000 });
  await page.getByRole('button', { name: 'Replay the curtain call' }).click();
  const move = await page
    .locator('.slot')
    .first()
    .evaluate((el) => el.style.getPropertyValue('--move'));
  expect(parseFloat(move)).toBeGreaterThan(400);
});

test('a resize after the walk-off leaves the cast off stage', async ({ page }) => {
  await waitForParade(page);
  await scrollTo(page, '#parade-end');
  await expect(page.locator('.slot[inert]')).toHaveCount(4, { timeout: 15_000 });
  await page.setViewportSize({ width: 1400, height: 720 });
  await expect
    .poll(() =>
      page
        .locator('.slot')
        .first()
        .evaluate((el) => el.getBoundingClientRect().left),
    )
    .toBeGreaterThan(1400);
});

test('a highlight clears even when a jump starts during the curtain call', async ({ page }) => {
  await waitForParade(page);
  await scrollTo(page, '#parade-end');
  await dot(page, /The White Rabbit/).click();
  const mention = page.locator('#cast-rabbit');
  await expect(mention).toHaveClass(/flash/);
  await expect(mention).toBeFocused();
  await expect(mention).not.toHaveClass(/flash/, { timeout: 5_000 });
});

test('focusing a dot peeks at the cast member too', async ({ page }) => {
  await waitForParade(page);
  const queen = dot(page, /The Queen of Hearts/);
  await queen.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(queen.locator('.label')).toHaveCSS('opacity', '1');
});

test('scrolling back up resets the curtain call', async ({ page }) => {
  await waitForParade(page);
  await scrollTo(page, '#parade-end');
  const rabbit = dot(page, /The White Rabbit/);
  await expect(rabbit).toHaveClass(/offstage/);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(rabbit).not.toHaveClass(/offstage/);
  await expect(rabbit).not.toHaveClass(/passed/);
});

test.describe('under reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the cast appears without walking or bowing, and stays still', async ({ page }) => {
    await waitForParade(page);
    await scrollTo(page, '#parade-end');
    const rabbit = dot(page, /The White Rabbit/);
    await expect(rabbit).toHaveClass(/(^|\s)in(\s|$)/);
    await page.waitForTimeout(500);
    await expect(rabbit).not.toHaveClass(/walking/);
    await expect(rabbit).not.toHaveClass(/bow/);
    await expect(rabbit.locator('.thigh').first()).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.replay-row')).toBeHidden();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('there’s no bar or replay button, and the article and cast list remain', async ({
    page,
  }) => {
    await page.goto(essay);
    await expect(page.locator('.parade')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Replay the curtain call' })).toBeHidden();
    await expect(page.getByRole('article')).toBeVisible();
    await expect(page.getByRole('link', { name: /The Cheshire Cat/ })).toBeVisible();
  });
});
