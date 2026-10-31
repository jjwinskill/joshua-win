import { expect, test } from '@playwright/test';

// What the public gets from the live site: the exit checks for #6.

const noRedirects = { maxRedirects: 0 } as const;

test.describe('noindex', () => {
  for (const [path, status] of [
    ['./', 200],
    ['no-such-page/', 404],
    ['_astro/no-such-file.js', 404],
  ] as const) {
    test(`${path} is a ${status} with noindex`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(status);
      expect(response.headers()['x-robots-tag']).toBe('noindex');
    });
  }
});

test.describe('redirects', () => {
  const home = 'https://joshua.win/skill/';
  for (const [from, to] of [
    ['https://joshua.win/', home],
    ['https://joshua.win/skill', home],
    ['https://www.joshua.win/', home],
    ['https://www.joshua.win/skill/no-such-page/', `${home}no-such-page/`],
    ['http://joshua.win/skill/', home],
  ] as const) {
    test(`${from} → ${to}`, async ({ request }) => {
      const response = await request.get(from, noRedirects);
      expect(response.status()).toBe(301);
      expect(response.headers()['location']).toBe(to);
      expect(response.headers()['x-robots-tag']).toBe('noindex');
    });
  }
});
