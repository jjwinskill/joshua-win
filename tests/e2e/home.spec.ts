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
          const animations = document.documentElement.getAnimations({
            subtree: true,
          }) as CSSAnimation[];
          const running = animations.map((animation) => animation.animationName);
          // The box's corners and edge at each keyframe.
          const box = animations.find(({ animationName }) =>
            ['card-grows', 'card-shrinks'].includes(animationName),
          );
          const keyframes = ((box?.effect as KeyframeEffect | null)?.getKeyframes() ?? []).map(
            (keyframe) => ({ radius: keyframe.borderTopLeftRadius, shadow: keyframe.boxShadow }),
          );
          // When the card's animations, and the card's own group, start and how long they run.
          const timings = Object.fromEntries(
            animations
              .filter(
                ({ animationName, effect }) =>
                  animationName.startsWith('card-') ||
                  (effect as KeyframeEffect | null)?.pseudoElement?.startsWith(
                    '::view-transition-group(piece-box-',
                  ),
              )
              .map(({ animationName, effect }) => {
                const { delay, duration } = effect?.getTiming() ?? {};
                const name = animationName.startsWith('card-') ? animationName : 'group';
                return [name, { delay: Number(delay), duration: Number(duration) }];
              }),
          );
          sessionStorage.setItem(
            'midTransition',
            JSON.stringify({
              parade: parade && getComputedStyle(parade).translate,
              running,
              keyframes,
              timings,
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
          keyframes: { radius?: string; shadow?: string }[];
          timings: Record<string, { delay: number; duration: number }>;
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

  test('under a theme, the box starts and ends on the card, and its timings stay in step', async ({
    page,
  }) => {
    await page.goto('./');
    // Not the house values, so a radius, border or timing written in place of a token would show.
    await page.evaluate(() => {
      const theme = () => {
        document.documentElement.style.setProperty('--radius-card', '7px');
        document.documentElement.style.setProperty('--border-width', '3px');
        document.documentElement.style.setProperty('--duration-card', '600ms');
      };
      theme();
      // The router replaces the root's attributes on each swap.
      document.addEventListener('astro:after-swap', theme);
    });
    await expect(page.locator('.piece-card').first()).toHaveCSS('border-top-left-radius', '7px');
    const edge = expect.stringMatching(/ 0px 0px 0px 3px inset$/);

    await page.evaluate(recordMidTransition);
    await openPiece(page);
    await expect
      .poll(() => midTransition(page))
      .toMatchObject({ running: expect.arrayContaining(['card-grows']) });
    const opening = await midTransition(page);
    expect(opening.keyframes[0]?.radius).toBe('7px');
    for (const { shadow } of opening.keyframes) expect(shadow).toEqual(edge);
    const card = opening.timings['card-grows']?.duration ?? 0;
    expect(card).toBeGreaterThan(0);
    expect(opening.timings['card-until-covered']?.duration).toBe(card);
    expect(opening.timings['card-once-covered']?.duration).toBe(card);
    // The box loses its corners at 76% as the group lands.
    expect(opening.timings.group?.duration).toBeCloseTo(card * 0.76);
    // The parade comes back up once the card has landed.
    const parade = page.locator('.parade');
    await expect(parade).toHaveCSS('translate', 'none');
    const paradeReturn = await parade.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(Number.parseFloat(paradeReturn)).toBeGreaterThan(0);

    // From rest, not from the middle of the opening.
    await forgetTransitions(page);
    await page.evaluate(recordMidTransition);
    await page.goBack();
    await expect
      .poll(() => midTransition(page))
      .toMatchObject({ running: expect.arrayContaining(['card-shrinks']) });
    const closing = await midTransition(page);
    expect(closing.keyframes.at(-1)?.radius).toBe('7px');
    for (const { shadow } of closing.keyframes) expect(shadow).toEqual(edge);
    expect(closing.timings['card-shrinks']?.duration).toBe(card);
    expect(closing.timings['card-until-sheet']?.duration).toBe(card);
    const group = closing.timings.group ?? { delay: 0, duration: 0 };
    expect(group.duration).toBeGreaterThan(0);
    // The group waits for the pages to swap, then lands as the box does.
    expect(group.delay + group.duration).toBeCloseTo(card);
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
