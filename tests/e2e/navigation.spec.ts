import { expect, test, type Page } from '@playwright/test';
import { failOnErrors } from './fail-on-errors';

// What has to survive <ClientRouter /> swapping the page without a reload (#45).
const fills = (page: Page) => page.locator('.parade .fill');

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

  await page.goForward();
  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.locator('.parade')).toHaveCount(1);
  await expect(fills(page)).toHaveAttribute('style', /scaleX/);
  await page.getByRole('button', { name: /The Queen of Hearts/ }).click();
  await expect(page.locator('#cast-queen')).toHaveClass(/flash/);
  expect(errors).toEqual([]);
});

test('leaving a piece removes the parade’s listeners', async ({ context, page }) => {
  await context.addInitScript(() => {
    const live = { count: 0 };
    (window as unknown as { scrollListeners: typeof live }).scrollListeners = live;
    const add = window.addEventListener.bind(window);
    const remove = window.removeEventListener.bind(window);
    window.addEventListener = ((type: string, ...rest: [EventListener]) => {
      if (type === 'scroll') live.count += 1;
      add(type, ...rest);
    }) as typeof window.addEventListener;
    window.removeEventListener = ((type: string, ...rest: [EventListener]) => {
      if (type === 'scroll') live.count -= 1;
      remove(type, ...rest);
    }) as typeof window.removeEventListener;
  });
  const listeners = () =>
    page.evaluate(
      () => (window as unknown as { scrollListeners: { count: number } }).scrollListeners.count,
    );
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  const before = await listeners();
  await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
  await expect(fills(page)).toHaveAttribute('style', /scaleX/);
  expect(await listeners()).toBeGreaterThan(before);
  await page.goBack();
  await expect(page.locator('.parade')).toHaveCount(0);
  await expect.poll(listeners).toBe(before);
});

test('the heavy page’s figures work when reached from the home page, and let go of WebGL', async ({
  context,
  page,
}) => {
  await context.addInitScript(() => {
    const contexts: WebGL2RenderingContext[] = [];
    (window as unknown as { glContexts: typeof contexts }).glContexts = contexts;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof getContext>
    ) {
      const made = getContext.apply(this, args);
      if (String(args[0]).startsWith('webgl') && made)
        contexts.push(made as WebGL2RenderingContext);
      return made;
    } as typeof getContext;
  });
  const errors = failOnErrors(page);
  await openFromHome(page, /Amet consectetur/);
  await page.locator('.heavy-scene').scrollIntoViewIfNeeded();
  await expect(page.locator('.heavy-scene canvas')).toHaveAttribute('data-running', 'true');
  await page.locator('.heavy-chart').scrollIntoViewIfNeeded();
  await expect(page.locator('.heavy-chart circle')).toHaveCount(2000);

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await expect(page.locator('.heavy-scene')).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const { glContexts } = window as unknown as { glContexts: WebGL2RenderingContext[] };
        return glContexts.length > 0 && glContexts.every((gl) => gl.isContextLost());
      }),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});

test('going back to a piece returns to where the reader was, past the figures', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('link', { name: /Amet consectetur/ }).click();
  await expect(page.getByRole('article')).toBeVisible();
  const marker = page.locator('#parade-end');
  await marker.evaluate((el) =>
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 300, behavior: 'instant' }),
  );
  await page.waitForTimeout(300);
  const top = () => marker.evaluate((el) => el.getBoundingClientRect().top);
  const before = await top();

  // Clicked from script: Playwright's click would scroll up to the link first, and that's what would be saved.
  await page
    .getByRole('link', { name: 'joshua.win/skill' })
    .evaluate((el: HTMLElement) => el.click());
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await page.goBack();
  await expect(marker).toBeAttached();
  await page.waitForTimeout(800);
  expect(Math.abs((await top()) - before)).toBeLessThan(20);
});

// The running transition takes every click, and Playwright answers a blocked click by retrying with the
// target scrolled somewhere else, which moves the position the test is about to save.
const transitionOver = (page: Page) =>
  expect(page.locator('html')).not.toHaveAttribute('data-swapping');

test('a cast card jumps to its first mention, and back returns to the card', async ({ page }) => {
  await openFromHome(page, /Lorem ipsum dolor/);
  await transitionOver(page);
  const mention = page.locator('#cast-cat');
  const card = page.getByRole('link', { name: /The Cheshire Cat/ });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => scrollY);
  await card.click();
  await expect(page).toHaveURL(/#cast-cat$/);
  await expect(mention).toBeInViewport();
  await expect(page.getByRole('article')).toBeVisible();
  await page.goBack();
  await expect(page).not.toHaveURL(/#cast-cat$/);
  await expect(page.getByRole('article')).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(before, -2);
});

test('back during the jump to a mention still returns to the card', async ({ page }) => {
  await openFromHome(page, /Lorem ipsum dolor/);
  await transitionOver(page);
  const card = page.getByRole('link', { name: /The Cheshire Cat/ });
  await card.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await card.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before - 200);
  await page.goBack();
  await expect(page).not.toHaveURL(/#cast-cat$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
  // The scroll that restored it has to be what's saved, not the frame of the jump that landed after it.
  await expect.poll(() => page.evaluate(() => history.state.scrollY)).toBe(before);
});

test('the new page is announced, and keeps its heading and styles', async ({ page }) => {
  await openFromHome(page, /Amet consectetur/);
  await expect(page.locator('.astro-route-announcer')).toHaveText('Amet consectetur');
  // The essay's own stylesheet arrived with the swap.
  await expect(page.locator('.parade')).toHaveCSS('position', 'fixed');
});
