import { expect, test, type Page } from '@playwright/test';

// The home page, the contents list and the card that expands into its piece (#32).
const essayUrl = /essays\/lorem-ipsum\/$/;
const morph = '::view-transition-group(piece-lorem-ipsum)';

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

  test('morphs the card into the piece, and back on browser back', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
    await expect(page).toHaveURL(essayUrl);
    await expect.poll(() => groupsSeen(page)).toContain(morph);

    await page.evaluate(() => sessionStorage.removeItem('groups'));
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
    await expect.poll(() => groupsSeen(page)).toContain(morph);
  });

  test('crossfades instead of flying in when going back from the bottom of the essay', async ({
    page,
  }) => {
    await page.goto('./');
    await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
    await expect(page).toHaveURL(essayUrl);
    await expect.poll(() => groupsSeen(page)).toContain(morph);
    await page.evaluate(() =>
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }),
    );

    await page.evaluate(() => sessionStorage.removeItem('groups'));
    await page.goBack();
    await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
    await expect.poll(() => groupsSeen(page)).toContain('::view-transition-group(root)');
    expect(await groupsSeen(page)).not.toContain(morph);

    // And coming back to the top still morphs.
    await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
    await expect(page).toHaveURL(essayUrl);
    await expect(page.locator('.essay-head')).not.toHaveAttribute('data-no-morph');
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('doesn’t animate', async ({ page }) => {
      await page.goto('./');
      await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
      await expect(page).toHaveURL(essayUrl);
      await page.waitForTimeout(600);
      expect(await groupsSeen(page)).toEqual([]);
    });
  });
});
