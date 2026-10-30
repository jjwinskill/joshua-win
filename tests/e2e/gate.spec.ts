import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { testSecret } from './invite';

// The invite gate (#4), as a reader meets it: no cookie here unless a test earns one.

const noRedirects = { maxRedirects: 0 } as const;
const builtAssets = fileURLToPath(new URL('../../dist/_astro', import.meta.url));
const placeholder = '[data-page="placeholder"]';

test.describe('without the invite cookie', () => {
  for (const path of ['./', 'essays/', 'no-such-page/']) {
    test(`${path} shows only the placeholder`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      expect(response?.headers()['x-robots-tag']).toBe('noindex');
      expect(response?.headers()['cache-control']).toBe('no-store');
      await expect(page.locator(placeholder)).toBeVisible();
    });
  }

  test('a built asset is the placeholder, not the asset', async ({ request }) => {
    const [file] = readdirSync(builtAssets);
    expect(file, 'the build should emit at least one file under _astro/').toBeDefined();
    const response = await request.get(`_astro/${file}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(await response.text()).toContain('data-page="placeholder"');
  });

  test('a wrong invite shows the placeholder and sets no cookie', async ({ page, context }) => {
    await page.goto('./?invite=wrong');
    await expect(page.locator(placeholder)).toBeVisible();
    expect(await context.cookies()).toEqual([]);
  });

  test('the placeholder loads nothing from behind the gate', async ({ request }) => {
    const html = await (await request.get('./')).text();
    expect(html).toContain('data-page="placeholder"');
    expect(html).not.toContain('_astro/');
  });

  test('a made-up cookie is refused', async ({ browser }) => {
    const context = await browser.newContext({ extraHTTPHeaders: { Cookie: 'invite=made-up' } });
    const page = await context.newPage();
    await page.goto('./');
    await expect(page.locator(placeholder)).toBeVisible();
    await context.close();
  });
});

test.describe('the invite link', () => {
  test('sets the cookie, lands on the clean URL, and the site stays open', async ({
    page,
    context,
    baseURL,
  }) => {
    await page.goto(`./?invite=${testSecret()}`);

    expect(page.url()).toBe(baseURL);
    await expect(page.locator(placeholder)).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const [cookie] = await context.cookies();
    expect(cookie).toMatchObject({
      name: 'invite',
      path: '/skill/',
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    });
    expect(cookie?.value).not.toContain(testSecret());
    const oneYearAway = Date.now() / 1000 + 365 * 24 * 60 * 60;
    expect(cookie?.expires).toBeGreaterThan(oneYearAway - 60);
    expect(cookie?.expires).toBeLessThan(oneYearAway + 60);

    // A later visit, with no link, just works.
    await page.goto('./');
    await expect(page.locator(placeholder)).toHaveCount(0);
  });

  test('the redirect is a 302 that no cache keeps', async ({ request }) => {
    const response = await request.get(`./?invite=${testSecret()}`, noRedirects);
    expect(response.status()).toBe(302);
    expect(response.headers()['cache-control']).toBe('no-store');
    expect(response.headers()['x-robots-tag']).toBe('noindex');
    expect(response.headers()['set-cookie']).not.toContain(testSecret());
  });
});

test.describe('redirects run before the gate', () => {
  test('the bare domain still redirects with no cookie', async ({ request, baseURL }) => {
    const response = await request.get(new URL('/', baseURL).href, noRedirects);
    expect(response.status()).toBe(301);
    expect(response.headers()['location']).toBe(new URL('/skill/', baseURL).href);
  });
});
