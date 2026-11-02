import { expect, test, type Page } from '@playwright/test';

// Lorem piece 2, the write-up, and its Mermaid floor (#53).
const writeUp = 'write-ups/excepteur-sint/';
const title = /Excepteur sint occaecat/;

test('its own card leads to its own route, and says it’s a write-up', async ({ page }) => {
  await page.goto('./');
  const card = page.getByRole('link', { name: title });
  await expect(card).toContainText(/Write-up/i);
  await card.click();
  await expect(page).toHaveURL(/write-ups\/excepteur-sint\/$/);
  await expect(page.getByRole('article').getByRole('heading', { level: 1 })).toHaveText(title);
  await expect(page.locator('.piece-head .kicker')).toContainText(/Write-up/i);
});

test('the contents page lists both kinds of piece at their own routes', async ({ page }) => {
  await page.goto('contents/');
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: title })).toHaveAttribute('href', /write-ups\//);
  await expect(main.getByRole('link', { name: 'Lorem ipsum dolor' })).toHaveAttribute(
    'href',
    /essays\//,
  );
});

test('it has no cast list or parade, and ships no JavaScript of its own', async ({ page }) => {
  await page.goto(writeUp);
  await expect(page.locator('.parade')).toHaveCount(0);
  await expect(page.getByRole('region', { name: /Cast/ })).toHaveCount(0);
  await expect(page.locator('astro-island')).toHaveCount(0);
});

test('the card grows into the write-up and shrinks back, as for an essay', async ({ page }) => {
  await page.goto('./');
  const running = () =>
    page.evaluate(() =>
      document.documentElement
        .getAnimations({ subtree: true })
        .map((animation) => (animation as CSSAnimation).animationName),
    );
  const seen = async (animation: string, go: () => Promise<unknown>) => {
    await page.evaluate(() => {
      document.addEventListener(
        'astro:before-swap',
        (event) => {
          const { viewTransition } = event as unknown as { viewTransition: ViewTransition };
          void viewTransition.ready.then(() => {
            const names = document.documentElement
              .getAnimations({ subtree: true })
              .map((running) => (running as CSSAnimation).animationName);
            sessionStorage.setItem('mid', JSON.stringify(names));
          });
        },
        { once: true },
      );
    });
    await go();
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('mid') ?? ''))
      .toContain(animation);
    await page.evaluate(() => sessionStorage.removeItem('mid'));
    await expect.poll(running).not.toContain(animation);
  };
  await seen('card-grows', () => page.getByRole('link', { name: title }).click());
  await expect(page).toHaveURL(/write-ups\/excepteur-sint\/$/);
  await seen('card-shrinks', () => page.goBack());
  await expect(page.getByRole('heading', { level: 1, name: 'Josh Winskill' })).toBeVisible();
});

test.describe('the Mermaid floor', () => {
  const charts = (page: Page) => page.locator('.run-chart');

  test('every chart idea is there, with its labels as real text and a list beside it', async ({
    page,
  }) => {
    await page.goto(writeUp);
    await expect(charts(page)).toHaveCount(3);
    for (const chart of await charts(page).all()) {
      await expect(chart.locator('[aria-hidden="true"] svg')).toBeVisible();
      await expect(chart.locator('figcaption')).toBeVisible();
      expect(await chart.locator('.visually-hidden li').count()).toBeGreaterThan(0);
    }
    await expect(charts(page).first().locator('svg text').first()).not.toBeEmpty();
  });

  // Mermaid sized the boxes on one machine, and a reader's fonts differ. Measured here in this browser.
  for (const [name, width] of [
    ['a phone', 375],
    ['a desktop', 1280],
  ] as const) {
    test(`on ${name}, charts fit the page and each label fits its box`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(writeUp);
      const overflowing = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      expect(overflowing).toBe(false);
      const misfits = await page.evaluate(() =>
        [...document.querySelectorAll('.run-chart .node')].flatMap((node) => {
          const shape = node.querySelector('rect, path, polygon') as SVGGraphicsElement | null;
          const label = node.querySelector('text') as SVGTextElement | null;
          if (!shape || !label) return [`no shape or label: ${node.id}`];
          const box = shape.getBoundingClientRect();
          const text = label.getBoundingClientRect();
          const fits =
            text.left >= box.left &&
            text.right <= box.right &&
            text.top >= box.top &&
            text.bottom <= box.bottom;
          return fits ? [] : [label.textContent ?? node.id];
        }),
      );
      expect(misfits).toEqual([]);
    });
  }

  test('on a phone, labels stay a readable size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(writeUp);
    const smallest = await page.evaluate(() =>
      Math.min(
        ...[...document.querySelectorAll('.run-chart svg')].map((svg) => {
          const label = svg.querySelector('.node text');
          const scale =
            svg.getBoundingClientRect().width / (svg as SVGSVGElement).viewBox.baseVal.width;
          return parseFloat(getComputedStyle(label as Element).fontSize) * scale;
        }),
      ),
    );
    expect(smallest).toBeGreaterThanOrEqual(10);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`in the ${colorScheme} theme`, () => {
      test.use({ colorScheme });

      test('it takes the page’s colors, with no black or white of its own', async ({ page }) => {
        await page.goto(writeUp);
        const colors = await page.evaluate(() => {
          const root = getComputedStyle(document.documentElement);
          const resolve = (name: string) => {
            const probe = document.createElement('i');
            probe.style.color = root.getPropertyValue(name);
            document.body.append(probe);
            const color = getComputedStyle(probe).color;
            probe.remove();
            return color;
          };
          const chart = document.querySelector('.run-chart') as Element;
          const style = (selector: string) =>
            getComputedStyle(chart.querySelector(selector) as Element);
          return {
            ink: resolve('--ink'),
            soft: resolve('--ink-soft'),
            paper: resolve('--paper'),
            label: style('.node text').fill,
            box: style('.node rect, .node path').fill,
            line: style('.flowchart-link').stroke,
            arrow: style('.arrowMarkerPath').fill,
          };
        });
        expect(colors.label).toBe(colors.ink);
        expect(colors.box).toBe(colors.paper);
        expect(colors.line).toBe(colors.soft);
        expect(colors.arrow).toBe(colors.soft);
      });
    });
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the text and every chart are there', async ({ page }) => {
    await page.goto(writeUp);
    await expect(page.getByRole('article').getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.locator('.run-chart svg')).toHaveCount(3);
    await expect(page.locator('.run-chart svg').first()).toBeVisible();
    expect(await page.locator('.piece-body p').count()).toBeGreaterThan(3);
  });
});
