import { expect, test, type Page } from '@playwright/test';

// What has to survive <ClientRouter /> swapping the page without a reload (#45).
const fills = (page: Page) => page.locator('.parade .fill');

function failOnErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function openFromHome(page: Page, name: RegExp) {
  await page.goto('./');
  await page.getByRole('link', { name }).click();
  await expect(page.getByRole('article')).toBeVisible();
}

test('the swap really stays in one document', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => ((window as unknown as { same: boolean }).same = true));
  await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
  await expect(page.getByRole('article')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { same?: boolean }).same)).toBe(true);
  await expect(page).toHaveTitle('Lorem ipsum dolor');
});

test('the parade works on a piece reached from the home page, and after going back and forth', async ({
  page,
}) => {
  const errors = failOnErrors(page);
  await openFromHome(page, /Lorem ipsum dolor/);
  await expect(fills(page)).toHaveAttribute('style', /scaleX/);
  await page.getByRole('button', { name: /The Cheshire Cat/ }).click();
  await expect(page.locator('#cast-cat')).toHaveClass(/flash/);

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await expect(page.locator('.parade')).toHaveCount(0);
  // A controller left behind would throw here, with its elements gone.
  await page.evaluate(() => window.scrollBy({ top: 200, behavior: 'instant' }));

  await page.goForward();
  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.locator('.parade')).toHaveCount(1);
  await expect(fills(page)).toHaveAttribute('style', /scaleX/);
  await page.getByRole('button', { name: /The Queen of Hearts/ }).click();
  await expect(page.locator('#cast-queen')).toHaveClass(/flash/);
  expect(errors).toEqual([]);
});

test('the heavy page’s figures work when reached from the home page', async ({ page }) => {
  const errors = failOnErrors(page);
  await openFromHome(page, /Amet consectetur/);
  await page.locator('.heavy-scene').scrollIntoViewIfNeeded();
  await expect(page.locator('.heavy-scene canvas')).toHaveAttribute('data-running', 'true');
  await page.locator('.heavy-chart').scrollIntoViewIfNeeded();
  await expect(page.locator('.heavy-chart circle')).toHaveCount(2000);

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await expect(page.locator('.heavy-scene')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a cast card jumps to its first mention, and back returns to the card', async ({ page }) => {
  await openFromHome(page, /Lorem ipsum dolor/);
  const mention = page.locator('#cast-cat');
  await page.getByRole('link', { name: /The Cheshire Cat/ }).click();
  await expect(page).toHaveURL(/#cast-cat$/);
  await expect(mention).toBeInViewport();
  await expect(page.getByRole('article')).toBeVisible();
  await page.goBack();
  await expect(page).not.toHaveURL(/#cast-cat$/);
  await expect(page.getByRole('article')).toBeVisible();
});

test('the new page is announced, and keeps its heading and styles', async ({ page }) => {
  await openFromHome(page, /Amet consectetur/);
  await expect(page.locator('.astro-route-announcer')).toHaveText('Amet consectetur');
  // The essay's own stylesheet arrived with the swap.
  await expect(page.locator('.parade')).toHaveCSS('position', 'fixed');
});
