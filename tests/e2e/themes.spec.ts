import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { failOnErrors } from './fail-on-errors';

// Phase 4's contending themes (#85). They're only in a build made with THEMES=yes, so on any other build these
// skip, and tests/build/themes.test.ts proves a normal build has none of them. To run them:
//   THEMES=yes pnpm build && pnpm test:e2e themes
const site = fileURLToPath(new URL('../../dist/skill', import.meta.url));
const routes = readdirSync(site, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.html'))
  .map((file) => `./${file.replace(/(index)?\.html$/, '')}`);

const writeUps = [
  { name: 'sorting-office', radius: '22px', dark: 'rgb(39, 31, 25)', light: 'rgb(251, 243, 222)' },
  { name: 'plum-hour', radius: '28px', dark: 'rgb(39, 29, 51)', light: 'rgb(251, 247, 236)' },
];
const modes = ['dark', 'light'] as const;
const writeUpCard = /Excepteur sint occaecat/;

// Puts a choice in storage before any page loads, as the switcher would.
async function choose(page: Page, choice: { writeup: string; mode: string }) {
  await page.addInitScript((value) => {
    localStorage.setItem('dev-theme', JSON.stringify({ house: 'soft-optical', ...value }));
  }, choice);
}

const rootToken = (page: Page, name: string) =>
  page.evaluate(
    (token) => getComputedStyle(document.documentElement).getPropertyValue(token).trim(),
    name,
  );

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  test.skip(!(await page.evaluate(() => 'devTheme' in window)), 'Not a THEMES=yes build');
});

test('the switcher changes the theme at once, and the choice survives the card transition and Back', async ({
  page,
}) => {
  const errors = failOnErrors(page);
  await page.getByText('Theme', { exact: true }).click();
  await page.getByLabel('Write-ups').selectOption('plum-hour');
  await page.getByLabel('Mode (themes only)').selectOption('dark');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-house', 'soft-optical');
  await expect(html).toHaveAttribute('data-writeup', 'plum-hour');
  await expect(html).toHaveAttribute('data-mode', 'dark');
  expect(await rootToken(page, '--paper')).toBe('#1c1511');

  await page.getByRole('link', { name: writeUpCard }).click();
  await expect(page).toHaveURL(/write-ups\/excepteur-sint\/$/);
  await expect(html).toHaveAttribute('data-writeup', 'plum-hour');
  await expect(html).toHaveAttribute('data-mode', 'dark');
  await expect(html).toHaveAttribute('data-kind', 'write-up');
  expect(await rootToken(page, '--accent')).toBe('#afb6f2');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /^Jost/);
  // The switcher is on the new page too, showing the choice.
  await expect(page.getByLabel('Write-ups')).toHaveValue('plum-hour');

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
  await expect(html).toHaveAttribute('data-writeup', 'plum-hour');
  await expect(html).not.toHaveAttribute('data-kind');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', /^Fraunces/);
  // The write-up's card keeps its theme on an essay's home page, so its title flies in one font.
  await expect(page.getByRole('heading', { level: 2, name: writeUpCard })).toHaveCSS(
    'font-family',
    /^Jost/,
  );
  expect(errors).toEqual([]);
});

test('today’s look takes every theme off', async ({ page }) => {
  await page.getByText('Theme', { exact: true }).click();
  await page.getByLabel('Essays and home').selectOption('off');
  await expect(page.locator('html')).not.toHaveAttribute('data-house');
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveCSS('font-family', /Fraunces/);
});

for (const writeUp of writeUps) {
  for (const mode of modes) {
    test(`every page passes axe's contrast rule with ${writeUp.name} write-ups, ${mode}`, async ({
      page,
    }) => {
      await choose(page, { writeup: writeUp.name, mode });
      for (const route of routes) {
        await page.goto(route, { waitUntil: 'networkidle' });
        await expect(page.locator('html')).toHaveAttribute('data-mode', mode);
        const { violations } = await new AxeBuilder({ page })
          .withRules(['color-contrast'])
          .exclude('.dev-theme')
          .analyze();
        expect(violations, route).toEqual([]);
      }
    });

    test(`the card grows and shrinks on a ${writeUp.name} write-up's own shape and color, ${mode}`, async ({
      page,
    }) => {
      await choose(page, { writeup: writeUp.name, mode });
      await page.goto('./');
      await page.evaluate(recordBox);
      await page.getByRole('link', { name: writeUpCard }).click();
      await expect.poll(() => box(page)).toMatchObject({ name: 'card-grows' });
      const opening = await box(page);
      expect(opening.radii[0]).toBe(writeUp.radius);
      expect(opening.background).toBe(writeUp[mode]);

      await page.waitForFunction(() => !document.documentElement.dataset.card);
      await page.evaluate(recordBox);
      await page.goBack();
      await expect.poll(() => box(page)).toMatchObject({ name: 'card-shrinks' });
      const closing = await box(page);
      // The home page's html is an essay's, so these come from the write-up's values on html.
      expect(closing.radii.at(-1)).toBe(writeUp.radius);
      expect(closing.background).toBe(writeUp[mode]);
      await expect(page.locator('html')).not.toHaveAttribute('data-moving-kind');
    });
  }
}

test('an essay’s card grows on Soft Optical’s shape', async ({ page }) => {
  await page.evaluate(recordBox);
  await page.getByRole('link', { name: /Lorem ipsum dolor/ }).click();
  await expect.poll(() => box(page)).toMatchObject({ name: 'card-grows' });
  expect((await box(page)).radii[0]).toBe('14px');
});

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
