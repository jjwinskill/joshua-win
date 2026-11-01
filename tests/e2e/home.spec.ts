import { expect, test, type Page } from '@playwright/test';

// The home page, the contents list and the card that expands into its piece (#32).
const essayUrl = /essays\/lorem-ipsum\/$/;
const morph = '::view-transition-group(piece-box-lorem-ipsum)';
const pieces = ['kicker', 'title', 'dek'].map(
  (piece) => `::view-transition-group(piece-${piece}-lorem-ipsum)`,
);

// Records every view-transition group that animates, across page loads, in sessionStorage.
function recordTransitions() {
  const tick = () => {
    const names = document.documentElement
      .getAnimations({ subtree: true })
      .map((animation) => (animation.effect as KeyframeEffect | null)?.pseudoElement)
      .filter((name) => name?.includes('view-transition-group'));
    if (names.length) {
      const seen = JSON.parse(sessionStorage.getItem('groups') ?? '[]') as string[];
      sessionStorage.setItem('groups', JSON.stringify([...new Set([...seen, ...names])]));
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const groupsSeen = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('groups') ?? '[]') as string[]);

test('the home page leads with Josh, then a card that links to the piece', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
  await expect(page).toHaveURL(essayUrl);
});

test('the contents page lists the piece plainly', async ({ page }) => {
  await page.goto('contents/');
  await page.getByRole('main').getByRole('link', { name: 'Lorem ipsum dolor' }).click();
  await expect(page).toHaveURL(essayUrl);
});

test('every page links back to the home page and the contents', async ({ page }) => {
  await page.goto('essays/lorem-ipsum/');
  const site = page.getByRole('navigation', { name: 'Site' });
  await expect(site.getByRole('link', { name: 'Contents' })).toBeVisible();
  await site.getByRole('link', { name: 'joshua.win/skill' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
});

test.describe('the card transition', () => {
  test.beforeEach(({ context }) => context.addInitScript(recordTransitions));

  // Resets the record only once nothing is animating, or a running transition writes itself back in.
  async function forgetTransitions(page: Page) {
    await page.waitForFunction(
      () =>
        !document.documentElement
          .getAnimations({ subtree: true })
          .some((animation) =>
            (animation.effect as KeyframeEffect | null)?.pseudoElement?.includes('view-transition'),
          ),
    );
    await page.evaluate(() => sessionStorage.removeItem('groups'));
  }

  async function openPiece(page: Page) {
    await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
    await expect(page).toHaveURL(essayUrl);
  }

  test('morphs the card into the piece, and back on browser back', async ({ page }) => {
    await page.goto('./');
    await openPiece(page);
    await expect.poll(() => groupsSeen(page)).toEqual(expect.arrayContaining([morph, ...pieces]));

    await forgetTransitions(page);
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
    await expect.poll(() => groupsSeen(page)).toEqual(expect.arrayContaining([morph, ...pieces]));
  });

  test('shrinks into the card, with no text flying in, going back from the bottom of the essay', async ({
    page,
  }) => {
    await page.goto('./');
    await openPiece(page);
    await expect.poll(() => groupsSeen(page)).toContain(morph);
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
    );

    await forgetTransitions(page);
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
    await expect.poll(() => groupsSeen(page)).toContain(morph);
    for (const name of pieces) expect(await groupsSeen(page)).not.toContain(name);

    // The next tap on the card morphs again.
    await forgetTransitions(page);
    await openPiece(page);
    await expect.poll(() => groupsSeen(page)).toContain(morph);
  });

  test('a card off screen on the new page fades in, without flying in', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 400 });
    await page.goto('essays/lorem-ipsum/');
    await page.getByRole('link', { name: 'joshua.win/skill' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
    await expect.poll(() => groupsSeen(page)).toContain('::view-transition-group(root)');
    await page.waitForTimeout(600);
    expect(await groupsSeen(page)).not.toContain(morph);
  });

  test('only the piece’s own card moves', async ({ page }) => {
    await page.goto('./');
    await openPiece(page);
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
    await expect(page.locator('.piece-card[href$="lorem-ipsum/"]')).not.toHaveAttribute(
      'data-no-morph',
    );
    await expect(page.locator('.piece-card[href$="amet-consectetur/"]')).toHaveAttribute(
      'data-no-morph',
    );
  });

  // Reads the page once the transition is running, before it has finished.
  function recordMidTransition() {
    document.addEventListener(
      'astro:before-swap',
      (event) => {
        const { viewTransition } = event as unknown as { viewTransition: ViewTransition };
        void viewTransition.ready.then(() => {
          const parade = document.querySelector('.parade');
          const running = document.documentElement
            .getAnimations({ subtree: true })
            .map((animation) => (animation as CSSAnimation).animationName);
          sessionStorage.setItem(
            'midTransition',
            JSON.stringify({
              parade: parade && getComputedStyle(parade).translate,
              running,
            }),
          );
        });
      },
      { once: true },
    );
  }

  const midTransition = (page: Page) =>
    page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem('midTransition') ?? '{}') as {
          parade: string | null;
          running: string[];
        },
    );

  test('the card grows, with the parade below the screen until it has landed', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(recordMidTransition);
    await openPiece(page);
    await expect
      .poll(() => midTransition(page))
      .toMatchObject({ parade: expect.stringMatching(/px|%/) });
    expect((await midTransition(page)).running).toContain('card-grows');
    await expect(page.locator('html')).not.toHaveAttribute('data-card');
    await expect(page.locator('.parade')).toHaveCSS('translate', 'none');
  });

  test('the parade waits on a route with no card too', async ({ page }) => {
    await page.goto('contents/');
    await page.evaluate(recordMidTransition);
    await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
    await expect
      .poll(() => midTransition(page))
      .toMatchObject({ parade: expect.stringMatching(/px|%/) });
    await expect(page.locator('.parade')).toHaveCSS('translate', 'none');
  });

  test('the page shrinks back into its card', async ({ page }) => {
    await page.goto('./');
    await openPiece(page);
    await page.evaluate(recordMidTransition);
    await page.goBack();
    await expect
      .poll(() => midTransition(page))
      .toMatchObject({
        running: expect.arrayContaining(['card-shrinks']),
      });
  });

  test('morphs back through the link home, and forward again', async ({ page }) => {
    await page.goto('./');
    await openPiece(page);
    await forgetTransitions(page);
    await page.getByRole('link', { name: 'joshua.win/skill' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
    await expect.poll(() => groupsSeen(page)).toContain(morph);

    await forgetTransitions(page);
    await openPiece(page);
    await expect.poll(() => groupsSeen(page)).toContain(morph);
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('doesn’t animate, forward or back', async ({ page }) => {
      await page.goto('./');
      await openPiece(page);
      await page.waitForTimeout(600);
      expect(await groupsSeen(page)).toEqual([]);

      await page.goBack();
      await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
      await page.waitForTimeout(600);
      expect(await groupsSeen(page)).toEqual([]);
    });
  });
});
