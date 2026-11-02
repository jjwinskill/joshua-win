// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createPageWarmer } from './warm-pages';

const routerInit = { signal: new AbortController().signal };
const href = new URL('/skill/essays/a/', location.href).href;
const page = () =>
  new Response('<link rel="stylesheet" href="/skill/_astro/a.css"><link rel="icon" href="/i.png">');

function setUp() {
  const real = vi.fn<typeof fetch>(async () => page());
  let time = 0;
  const warmer = createPageWarmer(real, () => time);
  return { real, warmer, advance: (ms: number) => (time += ms) };
}

describe('createPageWarmer', () => {
  it('gives the next fetch of a warmed page the copy, without a second request', async () => {
    const { real, warmer } = setUp();
    warmer.warm(href);
    await vi.waitFor(() => expect(real).toHaveBeenCalledTimes(2));
    const pages = real.mock.calls.filter(([url]) => url === href);
    const response = await warmer.fetch(href, routerInit);
    expect(pages).toHaveLength(1);
    expect(real.mock.calls.filter(([url]) => url === href)).toHaveLength(1);
    expect(await response.text()).toContain('a.css');
  });

  it('fetches the page’s stylesheets too, and nothing else it links', async () => {
    const { real, warmer } = setUp();
    warmer.warm(href);
    await vi.waitFor(() =>
      expect(real).toHaveBeenCalledWith('/skill/_astro/a.css', expect.anything()),
    );
    expect(real).not.toHaveBeenCalledWith('/i.png', expect.anything());
  });

  it('uses a copy once, so a later fetch is fresh', async () => {
    const { real, warmer } = setUp();
    warmer.warm(href);
    await warmer.fetch(href, routerInit);
    await warmer.fetch(href, routerInit);
    expect(real.mock.calls.filter(([url]) => url === href)).toHaveLength(2);
  });

  it('ignores an old copy', async () => {
    const { real, warmer, advance } = setUp();
    warmer.warm(href);
    advance(30 * 60_000);
    await warmer.fetch(href, routerInit);
    expect(real.mock.calls.filter(([url]) => url === href)).toHaveLength(2);
  });

  it('falls back to a real fetch if warming failed', async () => {
    const { real, warmer } = setUp();
    real.mockRejectedValueOnce(new Error('offline'));
    warmer.warm(href);
    const response = await warmer.fetch(href, routerInit);
    expect(response.ok).toBe(true);
  });

  it('keeps the copy for the router when something else fetches the page', async () => {
    const { real, warmer } = setUp();
    warmer.warm(href);
    await warmer.fetch(href, { priority: 'low' });
    const before = real.mock.calls.filter(([url]) => url === href).length;
    await warmer.fetch(href, routerInit);
    expect(real.mock.calls.filter(([url]) => url === href)).toHaveLength(before);
  });

  it('fetches a stylesheet once, and a failed one raises no error', async () => {
    const { real, warmer } = setUp();
    real.mockImplementation(async (url) => {
      if (url === '/skill/_astro/a.css') throw new Error('offline');
      return page();
    });
    warmer.warm(href);
    warmer.warm(new URL('/skill/essays/b/', location.href).href);
    await vi.waitFor(() =>
      expect(real).toHaveBeenCalledWith('/skill/_astro/a.css', expect.anything()),
    );
    await new Promise((resolve) => setTimeout(resolve));
    expect(real.mock.calls.filter(([url]) => url === '/skill/_astro/a.css')).toHaveLength(1);
  });

  it('leaves other pages and other methods alone', async () => {
    const { real, warmer } = setUp();
    warmer.warm(href);
    await warmer.fetch(href, { ...routerInit, method: 'POST' });
    await warmer.fetch('/skill/contents/');
    expect(real).toHaveBeenCalledWith(href, { ...routerInit, method: 'POST' });
    expect(real).toHaveBeenCalledWith('/skill/contents/', undefined);
  });
});
