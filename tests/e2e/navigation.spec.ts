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
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => scrollY);
  await card.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before - 200);
  await page.goBack();
  await expect(page).not.toHaveURL(/#cast-cat$/);
  // Long enough for the jump's last frame to land, or this reads the position before it moves.
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => [scrollY, history.state.scrollY])).toEqual([before, before]);
});

test('the new page is announced, and keeps its heading and styles', async ({ page }) => {
  await openFromHome(page, /Amet consectetur/);
  await expect(page.locator('.astro-route-announcer')).toHaveText('Amet consectetur');
  // The essay's own stylesheet arrived with the swap.
  await expect(page.locator('.parade')).toHaveCSS('position', 'fixed');
});

test('a tap uses the copy fetched ahead of time, with one history entry per page', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    // Not Astro's hover prefetch, which Playwright's click can set off.
    if (
      request.resourceType() === 'fetch' &&
      new URL(request.url()).pathname.endsWith('/essays/lorem-ipsum/')
    )
      requests.push(request.url());
  });
  await page.goto('./');
  await expect.poll(() => requests.length).toBe(1);
  const before = await page.evaluate(() => history.length);
  await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
  await expect(page.getByRole('article')).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('article')).toBeVisible();
});

test('the pages under the card swap before it starts to fade, and after it has faded in', async ({
  page,
}) => {
  await page.goto('./');
  const offsets = await page.evaluate(() => {
    const rules = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]);
    const find = (name: string, rule: CSSRule): CSSKeyframesRule[] => {
      if (rule instanceof CSSKeyframesRule && rule.name === name) return [rule];
      return rule instanceof CSSGroupingRule
        ? [...rule.cssRules].flatMap((r) => find(name, r))
        : [];
    };
    const keyframe = (name: string, fromEnd: boolean) => {
      const list = rules.flatMap((r) => find(name, r))[0]?.cssRules;
      const rule = list?.[fromEnd ? list.length - 2 : 1];
      return Number.parseFloat(rule?.cssText ?? 'NaN');
    };
    return [
      keyframe('card-until-covered', false),
      keyframe('card-grows', true),
      keyframe('card-until-sheet', false),
      keyframe('card-shrinks', false),
    ];
  });
  const [swapOpening, fadeStart, swapClosing, fadedIn] = offsets as [
    number,
    number,
    number,
    number,
  ];
  // 12% of 500ms is 60ms, nearly four frames at 60 Hz, since WebKit can run them apart.
  expect(fadeStart - swapOpening).toBeGreaterThanOrEqual(12);
  expect(swapClosing - fadedIn).toBeGreaterThanOrEqual(12);
});

test('a tap adds its history entry straight away, before the page has arrived', async ({
  page,
}) => {
  await page.route('**/essays/lorem-ipsum/', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.continue();
  });
  await page.goto('./');
  const before = await page.evaluate(() => history.length);
  await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByRole('article')).toBeVisible();
  expect(await page.evaluate(() => history.length)).toBe(before + 1);
});

test('if the page can’t be fetched, it loads in full at the top, not at the home page’s scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto('./');
  await page.evaluate(() => {
    const fail = () => Promise.reject(new Error('offline'));
    const real = window.fetch.bind(window);
    window.fetch = (input, init) => (init?.signal ? fail() : real(input, init));
  });
  const card = page.getByRole('link', { name: /Lorem ipsum dolor/ });
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await expect(page.getByRole('article')).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
