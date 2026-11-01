import { expect, test } from '@playwright/test';
import { failOnErrors } from './fail-on-errors';

// Lorem piece 3, written in MDX, with a one-off component in its prose (#57).
const tally = 'article .scroll-tally';

test('its own card leads to it, with its cast in order of appearance', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: /Ut labore et dolore/ }).click();
  await expect(page).toHaveURL(/essays\/ut-labore\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Ut labore et dolore' })).toBeVisible();
  const cards = page
    .getByRole('region', { name: /Cast, in order of appearance/ })
    .getByRole('link');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText('The Cheshire Cat');
  await expect(cards.last()).toContainText('The White Rabbit');
});

test('the one-off sits in a sentence, and hydrates when the page is reached from another', async ({
  page,
}) => {
  const errors = failOnErrors(page);
  await page.goto('./');
  await page.getByRole('link', { name: /Ut labore et dolore/ }).click();
  await expect(page.locator('article p .scroll-tally')).toHaveText(/^\d+%$/);
  const before = await page.locator(tally).textContent();
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
  await expect(page.locator(tally)).not.toHaveText(before ?? '');
  expect(errors).toEqual([]);
});

test('leaving the piece removes the one-off and its listeners, and it works again on return', async ({
  context,
  page,
}) => {
  await context.addInitScript(() => {
    const live = { count: 0 };
    (window as unknown as { resizeListeners: typeof live }).resizeListeners = live;
    const add = window.addEventListener.bind(window);
    const remove = window.removeEventListener.bind(window);
    // Resize, not scroll, so the parade's own scroll listeners don't blur the count.
    window.addEventListener = ((type: string, ...rest: [EventListener]) => {
      if (type === 'resize') live.count += 1;
      add(type, ...rest);
    }) as typeof window.addEventListener;
    window.removeEventListener = ((type: string, ...rest: [EventListener]) => {
      if (type === 'resize') live.count -= 1;
      remove(type, ...rest);
    }) as typeof window.removeEventListener;
  });
  const listeners = () =>
    page.evaluate(
      () => (window as unknown as { resizeListeners: { count: number } }).resizeListeners.count,
    );
  const errors = failOnErrors(page);
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  const before = await listeners();
  await page.getByRole('link', { name: /Ut labore et dolore/ }).click();
  await expect(page.locator(tally)).toHaveText(/^\d+%$/);
  expect(await listeners()).toBeGreaterThan(before);

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await expect(page.locator(tally)).toHaveCount(0);
  await expect.poll(listeners).toBe(before);

  await page.goForward();
  await expect(page.locator(tally)).toHaveText(/^\d+%$/);
  expect(errors).toEqual([]);
});

test('the parade works as on piece 1', async ({ page }) => {
  await page.goto('essays/ut-labore/');
  await expect(page.locator('.parade .fill')).toHaveAttribute('style', /scaleX/);
  await page.getByRole('button', { name: /The Queen of Hearts/ }).click();
  await expect(page.locator('#cast-queen')).toHaveClass(/flash/);
});

test('the home page doesn’t load a piece’s one-offs', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('astro-island')).toHaveCount(0);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the sentence still reads, and the whole piece is there', async ({ page }) => {
    await page.goto('essays/ut-labore/');
    await expect(page.locator(tally)).toHaveText('some');
    for (const key of ['rabbit', 'bottle', 'cat', 'queen']) {
      await expect(page.locator(`article span#cast-${key}`)).toHaveCount(1);
    }
  });
});
