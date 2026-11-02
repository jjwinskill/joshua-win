import { expect, test } from '@playwright/test';

// Lorem piece 1 as a reader gets it, with and without JavaScript (#30).
const essay = 'essays/lorem-ipsum/';

test('the essay is a complete article with its cast in order of appearance', async ({ page }) => {
  await page.goto(essay);
  await expect(page.getByRole('article').getByRole('heading', { level: 1 })).toBeVisible();
  const cards = page
    .getByRole('region', { name: /Cast, in order of appearance/ })
    .getByRole('link');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText('A crumpled sheet of paper');
  await expect(cards.last()).toContainText('A glass of milk');
  for (const key of ['paper', 'hanta', 'press', 'milk']) {
    await expect(page.locator(`article span#cast-${key}`)).toHaveCount(1);
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a cast card jumps to its first mention and highlights it', async ({ page }) => {
    await page.goto(essay);
    const mention = page.locator('#cast-press');
    const before = await mention.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.getByRole('link', { name: /The giant new hydraulic press at Bubny/ }).click();
    await expect(page).toHaveURL(/#cast-press$/);
    await expect(mention).toBeInViewport();
    await expect(mention).not.toHaveCSS('background-color', before);
  });
});
