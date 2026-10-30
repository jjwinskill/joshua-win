import { readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

// The Worker in front of the static files (#3): noindex on every response, and redirects into /skill/.

const noRedirects = { maxRedirects: 0 } as const;

test('the hello page renders under /skill/ with noindex', async ({ page }) => {
  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  expect(response?.headers()['x-robots-tag']).toBe('noindex');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test.describe('noindex on every kind of response', () => {
  test('a built asset', async ({ request }) => {
    const [file] = readdirSync('dist/_astro');
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

  test('www → the bare domain over https', async ({ request, baseURL }) => {
    const response = await request.get(new URL('/', baseURL).href, {
      ...noRedirects,
      headers: { Host: 'www.joshua.win' },
    });
    expect(response.status()).toBe(301);
    expect(response.headers()['location']).toBe('https://joshua.win/skill/');
    expect(response.headers()['x-robots-tag']).toBe('noindex');
  });
});
