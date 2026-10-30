import { expect, test } from '@playwright/test';

// What the public gets from the live site, with no cookie: the exit checks for #6.

const noRedirects = { maxRedirects: 0 } as const;
const placeholder = 'data-page="placeholder"';

test.describe('without the invite cookie', () => {
  for (const path of ['./', 'essays/', 'no-such-page/', '_astro/anything.js']) {
    test(`${path} is only the placeholder, with noindex`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      expect(response.headers()['x-robots-tag']).toBe('noindex');
      expect(response.headers()['cache-control']).toBe('no-store');
      expect(response.headers()['strict-transport-security']).toContain('max-age=');
      expect(await response.text()).toContain(placeholder);
    });
  }

  test('nothing was injected into the placeholder', async ({ request }) => {
    // Cloudflare can add scripts to proxied pages (automatic Web Analytics, say). It must stay bare.
    const html = await (await request.get('./')).text();
    expect(html).not.toMatch(/<script\b/i);
  });

  test('a wrong invite sets no cookie', async ({ request }) => {
    const response = await request.get('./?invite=wrong', noRedirects);
    expect(response.status()).toBe(200);
    expect(response.headers()['set-cookie']).toBeUndefined();
    expect(await response.text()).toContain(placeholder);
  });
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
      expect(response.headers()['cache-control']).toBe('no-store');
    });
  }
});
