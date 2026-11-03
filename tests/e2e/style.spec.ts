import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The house style's two looks (G51): Soft Optical on the essays and the site, and Plum Hour on a write-up and its
// card. routes.spec.ts runs axe on every page in light, so this runs it in dark.
const site = fileURLToPath(new URL('../../dist/skill', import.meta.url));
const routes = readdirSync(site, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.html'))
  .map((file) => `./${file.replace(/(index)?\.html$/, '')}`);

const writeUpCard = /Excepteur sint occaecat/;
const looks = [
  {
    name: 'a write-up (Plum Hour)',
    card: writeUpCard,
    radius: '28px',
    dark: 'rgb(39, 29, 51)',
    light: 'rgb(251, 247, 236)',
  },
  {
    name: 'an essay (Soft Optical)',
    card: /Lorem ipsum dolor/,
    radius: '14px',
    dark: 'rgb(39, 30, 24)',
    light: 'rgb(255, 249, 238)',
  },
];

const rootToken = (page: Page, name: string) =>
  page.evaluate(
    (token) => getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
    name,
  );

for (const route of routes) {
  test(`${route} has no axe violations in dark`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    expect(await rootToken(page, 'color-scheme')).toContain('dark');
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}

test('a write-up and its card are in Plum Hour, and the rest of the site in Soft Optical', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('./');
  const html = page.locator('html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /^Fraunces/);
  expect(await rootToken(page, '--paper')).toBe('#1c1511');
  // The card has the write-up's font, so its title flies in one font (G44), and focuses in its own color.
  await expect(page.getByRole('heading', { level: 2, name: writeUpCard })).toHaveCSS(
    'font-family',
    /^Jost/,
  );
  expect(
    await page
      .getByRole('link', { name: writeUpCard })
      .evaluate((card) => getComputedStyle(card).getPropertyValue('--focus-ring').trim()),
  ).toBe('3px solid #afb6f2');

  await page.getByRole('link', { name: writeUpCard }).click();
  await expect(page).toHaveURL(/write-ups\/excepteur-sint\/$/);
  await expect(html).toHaveAttribute('data-kind', 'write-up');
  expect(await rootToken(page, '--accent')).toBe('#afb6f2');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /^Jost/);

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await expect(html).not.toHaveAttribute('data-kind');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /^Fraunces/);
});

for (const { name, card, radius, ...colors } of looks) {
  for (const scheme of ['dark', 'light'] as const) {
    test(`the card grows and shrinks on its own shape and color: ${name}, ${scheme}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('./');
      await page.evaluate(recordBox);
      await page.getByRole('link', { name: card }).click();
      await expect.poll(() => box(page)).toMatchObject({ name: 'card-grows' });
      const opening = await box(page);
      expect(opening.radii[0]).toBe(radius);
      expect(opening.background).toBe(colors[scheme]);

      await page.waitForFunction(() => !document.documentElement.dataset.card);
      await page.evaluate(recordBox);
      await page.goBack();
      await expect.poll(() => box(page)).toMatchObject({ name: 'card-shrinks' });
      const closing = await box(page);
      // Going home from a write-up, html is an essay's, so these come from the write-up's tokens.
      expect(closing.radii.at(-1)).toBe(radius);
      expect(closing.background).toBe(colors[scheme]);
      await expect(page.locator('html')).not.toHaveAttribute('data-moving-kind');
    });
  }
}

test('a write-up reached with no card, from the contents and back, keeps its sheet see-through', async ({
  page,
}) => {
  await page.goto('contents/');
  for (const go of [
    () => page.getByRole('link', { name: writeUpCard }).click(),
    () => page.goBack(),
  ]) {
    await page.evaluate(recordSheet);
    await go();
    await expect.poll(() => sheet(page)).toMatchObject({ card: false });
    expect((await sheet(page)).background).toBe('rgba(0, 0, 0, 0)');
    await page.waitForFunction(() => !document.documentElement.dataset.movingKind);
  }
});

// The write-up's sheet, which is the moving box's name with no card on the other page.
function recordSheet() {
  sessionStorage.removeItem('sheet');
  document.addEventListener(
    'astro:before-swap',
    (event) => {
      const { viewTransition } = event as unknown as { viewTransition: ViewTransition };
      void viewTransition.ready.then(() => {
        const pair = '::view-transition-image-pair(piece-box-excepteur-sint)';
        sessionStorage.setItem(
          'sheet',
          JSON.stringify({
            card: 'card' in document.documentElement.dataset,
            background: getComputedStyle(document.documentElement, pair).backgroundColor,
          }),
        );
      });
    },
    { once: true },
  );
}

const sheet = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem('sheet') ?? '{}') as {
        card?: boolean;
        background?: string;
      },
  );

// The moving box's animation, its corners at each keyframe and its color, once the transition is running.
function recordBox() {
  document.addEventListener(
    'astro:before-swap',
    (event) => {
      const { viewTransition } = event as unknown as { viewTransition: ViewTransition };
      void viewTransition.ready.then(() => {
        const animation = (
          document.documentElement.getAnimations({ subtree: true }) as CSSAnimation[]
        ).find(({ animationName }) => ['card-grows', 'card-shrinks'].includes(animationName));
        const effect = animation?.effect as KeyframeEffect | undefined;
        sessionStorage.setItem(
          'box',
          JSON.stringify({
            name: animation?.animationName,
            radii: effect?.getKeyframes().map((keyframe) => keyframe.borderTopLeftRadius) ?? [],
            background:
              effect?.pseudoElement &&
              getComputedStyle(document.documentElement, effect.pseudoElement).backgroundColor,
          }),
        );
      });
    },
    { once: true },
  );
}

const box = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(sessionStorage.getItem('box') ?? '{}') as {
        name?: string;
        radii: string[];
        background?: string;
      },
  );
