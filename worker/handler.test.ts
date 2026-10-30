import { describe, expect, it, vi } from 'vitest';
import { inviteToken } from './gate';
import { handle, type Assets } from './handler';

const SECRET = 'correct-horse';
const on = { gate: 'on', secret: SECRET };
const home = 'https://joshua.win/skill/';

// A stand-in for the ASSETS binding: the placeholder page, or a page with its own headers.
function fakeAssets(): Assets & { requested: string[] } {
  const requested: string[] = [];
  return {
    requested,
    fetch: async (request) => {
      const { pathname } = new URL(request.url);
      requested.push(pathname);
      return pathname === '/skill/placeholder/'
        ? new Response('placeholder', { headers: { ETag: '"p"', 'Cache-Control': 'public' } })
        : new Response('page', { headers: { ETag: '"a"', 'Cache-Control': 'public' } });
    },
  };
}
const failingAssets: Assets = {
  fetch: async () => {
    throw new Error('assets binding down');
  },
};
const memberRequest = async (href = home) =>
  new Request(href, { headers: { Cookie: `invite=${await inviteToken(SECRET)}` } });

describe('handle', () => {
  describe('every response', () => {
    it('adds noindex to a page, keeping its own headers', async () => {
      const response = await handle(await memberRequest(), fakeAssets(), on);
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
      expect(response.headers.get('ETag')).toBe('"a"');
      expect(await response.text()).toBe('page');
    });

    it('redirects with a 301 and noindex, before the gate and without the assets', async () => {
      const assets = fakeAssets();
      const response = await handle(new Request('https://joshua.win/'), assets, on);
      expect(response.status).toBe(301);
      expect(response.headers.get('Location')).toBe('https://joshua.win/skill/');
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
      expect(assets.requested).toEqual([]);
    });

    it('keeps a redirect that carries an invite out of every cache', async () => {
      const assets = fakeAssets();
      const response = await handle(
        new Request(`https://www.joshua.win/skill/?invite=${SECRET}`),
        assets,
        on,
      );
      expect(response.status).toBe(301);
      expect(response.headers.get('Location')).toBe(`https://joshua.win/skill/?invite=${SECRET}`);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    });

    it('sets HSTS on public hosts, redirects included, and not locally', async () => {
      const assets = fakeAssets();
      const hsts = 'Strict-Transport-Security';
      const page = await handle(await memberRequest(), assets, on);
      expect(page.headers.get(hsts)).toBe('max-age=2592000');
      const redirect = await handle(new Request('https://joshua.win/'), assets, on);
      expect(redirect.headers.get(hsts)).toBe('max-age=2592000');
      const local = await handle(new Request('http://127.0.0.1:8787/skill/'), assets, on);
      expect(local.headers.get(hsts)).toBeNull();
    });

    it('turns a failure into a 500 that still carries noindex', async () => {
      const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
      const response = await handle(await memberRequest(), failingAssets, on);
      expect(response.status).toBe(500);
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
      expect(logged).toHaveBeenCalledOnce();
      logged.mockRestore();
    });
  });

  describe('without a valid cookie', () => {
    it('serves the placeholder as a plain, uncacheable 200', async () => {
      const response = await handle(new Request(home), fakeAssets(), on);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('placeholder');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('ETag')).toBeNull();
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    });

    it('never fetches the requested path, whatever it is', async () => {
      const assets = fakeAssets();
      await handle(new Request(`${home}_astro/client.js`), assets, on);
      expect(assets.requested).toEqual(['/skill/placeholder/']);
    });

    it('ignores conditional headers, so a cached page is never revalidated as current', async () => {
      const assets = fakeAssets();
      const fetched = vi.spyOn(assets, 'fetch');
      await handle(new Request(home, { headers: { 'If-None-Match': '"a"' } }), assets, on);
      expect(fetched.mock.calls[0]?.[0].headers.get('If-None-Match')).toBeNull();
    });

    it('fails closed with a 500 if the placeholder page is missing', async () => {
      const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
      const missing: Assets = { fetch: async () => new Response(null, { status: 404 }) };
      const response = await handle(new Request(home), missing, on);
      expect(response.status).toBe(500);
      expect(logged).toHaveBeenCalledOnce();
      logged.mockRestore();
    });

    it('serves the placeholder to everyone when the secret is missing', async () => {
      const response = await handle(await memberRequest(), fakeAssets(), { gate: 'on' });
      expect(await response.text()).toBe('placeholder');
    });
  });

  describe('the invite link', () => {
    it('sets the cookie and redirects to the clean URL with an uncacheable 302', async () => {
      const assets = fakeAssets();
      const response = await handle(new Request(`${home}?invite=${SECRET}`), assets, on);
      expect(response.status).toBe(302);
      expect(response.headers.get('Location')).toBe(home);
      expect(response.headers.get('Set-Cookie')).toContain(`invite=${await inviteToken(SECRET)}`);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
      expect(assets.requested).toEqual([]);
    });
  });

  describe('with a valid cookie', () => {
    it('keeps pages out of shared caches and revalidated every time', async () => {
      const response = await handle(await memberRequest(), fakeAssets(), on);
      expect(response.headers.get('Cache-Control')).toBe('private, no-cache');
    });
  });

  describe('gate off', () => {
    it('serves the page with its own cache headers, and no cookie needed', async () => {
      const response = await handle(new Request(home), fakeAssets(), { gate: 'off' });
      expect(await response.text()).toBe('page');
      expect(response.headers.get('Cache-Control')).toBe('public');
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    });
  });
});
