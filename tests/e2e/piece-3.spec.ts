import { expect, test, type Page } from '@playwright/test';
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
  // A full reload would clear this, and the listener count with it, so this proves pages really swap.
  await page.evaluate(() => {
    (window as unknown as { sameDocument: boolean }).sameDocument = true;
  });
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
  const returned = await page.locator(tally).textContent();
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }));
  await expect(page.locator(tally)).not.toHaveText(returned ?? '');
  expect(
    await page.evaluate(() => (window as unknown as { sameDocument?: boolean }).sameDocument),
  ).toBe(true);
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

test.describe('its treatment', () => {
  const font = /BricolageGrotesque.*\.woff2/;

  test('the body is in the piece’s font, and the card’s text stays in the house font', async ({
    page,
  }) => {
    await page.goto('essays/ut-labore/');
    await expect(page.locator('.piece-body p').first()).toHaveCSS(
      'font-family',
      /^"Bricolage Grotesque"/,
    );
    for (const text of ['h1', '.kicker', '.dek']) {
      await expect(page.locator(`article ${text}`)).not.toHaveCSS('font-family', /Bricolage/);
    }
    await expect
      .poll(() => page.evaluate(() => document.fonts.check('17px "Bricolage Grotesque"', 'Haňťa')))
      .toBe(true);
  });

  test('it stays inside the article', async ({ page }) => {
    await page.goto('essays/ut-labore/');
    await expect(page.locator('.site-nav')).not.toHaveCSS('font-family', /Bricolage/);
    await expect(page.locator('.cast-section h2')).not.toHaveCSS('font-family', /Bricolage/);
  });

  test('other pages don’t load the font, and the home page only pays once the card is tapped', async ({
    page,
  }) => {
    const fonts: string[] = [];
    page.on('request', (request) => {
      if (font.test(request.url())) fonts.push(request.url());
    });
    for (const route of ['./', 'contents/', 'essays/lorem-ipsum/', 'write-ups/excepteur-sint/']) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }
    expect(fonts).toEqual([]);

    await page.goto('./');
    await page.getByRole('link', { name: /Ut labore et dolore/ }).click();
    await expect(page.getByRole('article')).toBeVisible();
    await expect.poll(() => fonts.length).toBeGreaterThan(0);
  });

  test('the parade stays out of the transition until the card lands', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => {
      document.addEventListener(
        'astro:before-swap',
        (event) => {
          const { viewTransition } = event as unknown as { viewTransition: ViewTransition };
          void viewTransition.ready.then(() => {
            const parade = document.querySelector('.parade');
            sessionStorage.setItem('parade', parade ? getComputedStyle(parade).translate : '');
          });
        },
        { once: true },
      );
    });
    await page.getByRole('link', { name: /Ut labore et dolore/ }).click();
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('parade'))).toMatch(/px|%/);
    await expect(page.locator('.parade')).toHaveCSS('translate', 'none');
  });
});

test.describe('the Swirl', () => {
  const route = 'essays/ut-labore/';
  const swirl = '.swirl';
  const firstWords = 'Lorem ipsum dolor sit amet';

  const sectionTop = (page: Page) =>
    page.evaluate(
      (selector) => (document.querySelector(selector)?.getBoundingClientRect().top ?? 0) + scrollY,
      swirl,
    );
  const scrollTo = (page: Page, top: number) =>
    page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
  const wind = (page: Page) =>
    page.evaluate((selector) => {
      const section = document.querySelector<HTMLElement>(selector);
      return parseFloat(section?.style.getPropertyValue('--swirl-wind') ?? '');
    }, swirl);
  const stageTop = (page: Page) =>
    page.evaluate(() => document.querySelector('.swirl-stage')?.getBoundingClientRect().top);
  // A fingerprint of what's on the canvas, from the page's own pixels.
  const drawing = (page: Page) =>
    page.evaluate(() => {
      const canvas = document.querySelector('.swirl canvas') as HTMLCanvasElement;
      const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
      let sum = 0;
      for (let i = 3; i < (pixels?.length ?? 0); i += 4) {
        sum = (sum * 31 + (pixels?.[i] ?? 0)) % 1000003;
      }
      return sum;
    });

  test('the page really scrolls, the stage lets go at the end, and the spiral scrolls away', async ({
    page,
  }) => {
    const errors = failOnErrors(page);
    await page.goto(route);
    await expect(page.locator(swirl)).toHaveAttribute('data-drawn');
    const top = await sectionTop(page);
    const distance = await wind(page);

    await scrollTo(page, top + distance / 2);
    await expect.poll(() => stageTop(page)).toBeCloseTo(0, 0);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(top + distance / 2, -1);
    const halfway = await drawing(page);

    await scrollTo(page, top + distance / 4);
    await expect.poll(() => drawing(page)).not.toBe(halfway);

    await scrollTo(page, Math.ceil(top + distance));
    await expect.poll(() => stageTop(page)).toBeLessThanOrEqual(0);
    await page.waitForTimeout(100);
    const finished = await drawing(page);
    await scrollTo(page, top + distance + 200);
    await expect.poll(() => stageTop(page)).toBeLessThan(-190);
    await page.waitForTimeout(100);
    expect(await drawing(page)).toBe(finished);
    expect(errors).toEqual([]);
  });

  test('the stage stops above the parade’s bar', async ({ page }) => {
    await page.goto(route);
    await expect(page.locator(swirl)).toHaveAttribute('data-drawn');
    await scrollTo(page, Math.ceil(await sectionTop(page)) + 1);
    await expect.poll(() => stageTop(page)).toBeCloseTo(0, 0);
    const [stageBottom, barTop] = await page.evaluate(() => [
      document.querySelector('.swirl-stage')?.getBoundingClientRect().bottom ?? 0,
      document.querySelector('.parade')?.getBoundingClientRect().top ?? 0,
    ]);
    expect(stageBottom).toBeLessThanOrEqual(barTop ?? 0);
  });

  test('a screen reader still gets the paragraphs once it’s drawn', async ({ page }) => {
    await page.goto(route);
    await expect(page.locator(swirl)).toHaveAttribute('data-drawn');
    await expect(page.locator(`${swirl} p`)).toHaveCount(4);
    await expect(page.locator(`${swirl} canvas`)).toHaveAttribute('aria-hidden', 'true');
    expect(await page.locator(swirl).ariaSnapshot()).toContain(firstWords);
  });

  test('the height CSS holds from the start is the height it measures, so hydrating moves nothing', async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page.locator(swirl)).toHaveAttribute('data-drawn');
    const [measured, held] = await page.evaluate((selector) => {
      const section = document.querySelector<HTMLElement>(selector);
      const before = section?.offsetHeight ?? 0;
      section?.style.removeProperty('--swirl-wind');
      return [before, section?.offsetHeight ?? 0];
    }, swirl);
    expect(Math.abs(measured - held)).toBeLessThanOrEqual(2);
  });

  test('a failed bundle still shows every paragraph as the reader scrolls', async ({ page }) => {
    await page.route('**/*.js', (route) => route.abort());
    await page.goto(route);
    const section = page.locator(swirl);
    await expect(section).not.toHaveAttribute('data-drawn');
    const paragraphs = section.locator('p');
    const top = await sectionTop(page);
    const height = await section.evaluate((el) => (el as HTMLElement).offsetHeight);
    for (let i = 0; i < 4; i++) {
      await scrollTo(page, top + (height * i) / 4 + 10);
      await expect(paragraphs.nth(i)).toBeInViewport({ ratio: 1 });
    }
  });

  test('no first mention sits inside it', async ({ page }) => {
    await page.goto(route);
    await expect(page.locator(`${swirl} span[id^="cast-"]`)).toHaveCount(0);
  });

  test('it stops drawing off screen, cleans up, and works again from another page', async ({
    context,
    page,
  }) => {
    await context.addInitScript(() => {
      const counts = { letters: 0, frames: 0 };
      (window as unknown as { counts: typeof counts }).counts = counts;
      const fillText = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (...args) {
        counts.letters += 1;
        fillText.apply(this, args);
      };
    });
    const letters = () =>
      page.evaluate(() => (window as unknown as { counts: { letters: number } }).counts.letters);
    const errors = failOnErrors(page);
    await page.goto('./');
    await page.getByRole('link', { name: /Ut labore et dolore/ }).click();
    await expect(page.locator(swirl)).toHaveAttribute('data-drawn');

    // Well above the section, it's drawn once on mount and then not again.
    const drawnOnce = await letters();
    expect(drawnOnce).toBeGreaterThan(0);
    await scrollTo(page, 200);
    await page.waitForTimeout(200);
    expect(await letters()).toBe(drawnOnce);

    const top = await sectionTop(page);
    await scrollTo(page, top + 300);
    await expect.poll(letters).toBeGreaterThan(drawnOnce);

    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
    await expect(page.locator(swirl)).toHaveCount(0);
    const afterLeaving = await letters();
    await page.waitForTimeout(200);
    expect(await letters()).toBe(afterLeaving);

    await page.goForward();
    await expect(page.locator(swirl)).toHaveAttribute('data-drawn');
    const back = await drawing(page);
    await scrollTo(page, (await sectionTop(page)) + 600);
    await expect.poll(() => drawing(page)).not.toBe(back);
    expect(errors).toEqual([]);
  });

  test('Back restores a place past the section, with the finished spiral in its place', async ({
    page,
  }) => {
    await page.goto('./');
    await page.getByRole('link', { name: /Ut labore et dolore/ }).click();
    await expect(page.locator(swirl)).toHaveAttribute('data-drawn');
    const past = (await sectionTop(page)) + (await wind(page)) + 500;
    await scrollTo(page, past);
    await page.waitForTimeout(100);
    await page
      .getByRole('link', { name: 'Contents' })
      .evaluate((el) => (el as HTMLElement).click());
    await expect(page.locator(swirl)).toHaveCount(0);
    await page.goBack();
    await expect(page.locator(swirl)).toHaveAttribute('data-drawn');
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(past, -1);
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('it’s plain paragraphs', async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator(swirl)).not.toHaveAttribute('data-drawn');
      await expect(page.locator('.swirl-stage')).toBeHidden();
      await expect(page.locator(`${swirl} p`).first()).toHaveCSS('position', 'static');
      const height = await page.locator(swirl).evaluate((el) => (el as HTMLElement).offsetHeight);
      expect(height).toBeLessThan(1000);
    });
  });
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

  test('the Swirl is plain paragraphs', async ({ page }) => {
    await page.goto('essays/ut-labore/');
    await expect(page.locator('.swirl p')).toHaveCount(4);
    await expect(page.locator('.swirl p').first()).toBeVisible();
    await expect(page.locator('.swirl-stage')).toBeHidden();
    const height = await page.locator('.swirl').evaluate((el) => (el as HTMLElement).offsetHeight);
    expect(height).toBeLessThan(1000);
  });
});
