import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// The Worker in front of the static files (#3): noindex on every response, and redirects into /skill/.

const noRedirects = { maxRedirects: 0 } as const;
const builtAssets = fileURLToPath(new URL('../../dist/skill/_astro', import.meta.url));

test('the home page renders under /skill/ with noindex', async ({ page }) => {
  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['x-robots-tag']).toBe('noindex');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test.describe('noindex on every kind of response', () => {
  test('a built asset', async ({ request }) => {
    const [file] = readdirSync(builtAssets);
    expect(file, 'the build should emit at least one file under _astro/').toBeDefined();
    const response = await request.get(`_astro/${file}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-robots-tag']).toBe('noindex');
  });

  test('a missing page', async ({ request }) => {
    const response = await request.get('no-such-page/');
    expect(response.status()).toBe(404);
    expect(response.headers()['x-robots-tag']).toBe('noindex');
  });

  test("Cloudflare's own trailing-slash redirect", async ({ request }) => {
    const response = await request.get('index.html', noRedirects);
    expect(response.status()).toBe(307);
    expect(response.headers()['location']).toBe('/skill/');
    expect(response.headers()['x-robots-tag']).toBe('noindex');
  });
});

test.describe('redirects into /skill/', () => {
  for (const path of ['/', '/favicon.ico', '/skill']) {
    test(`${path} → /skill/`, async ({ request, baseURL }) => {
      const response = await request.get(new URL(path, baseURL).href, noRedirects);
      expect(response.status()).toBe(301);
      expect(response.headers()['location']).toBe(new URL('/skill/', baseURL).href);
      expect(response.headers()['x-robots-tag']).toBe('noindex');
    });
  }

  // www is covered by worker/route.test.ts and, on the live host, tests/smoke/: `wrangler dev` sets
  // the host the Worker sees (dev.host in wrangler.jsonc), so a Host header can't reach that branch.
});
