// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createPageWarmer } from './warm-pages';

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
    const response = await warmer.fetch(href);
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
    await warmer.fetch(href);
    await warmer.fetch(href);
    expect(real.mock.calls.filter(([url]) => url === href)).toHaveLength(2);
  });

  it('ignores an old copy', async () => {
    const { real, warmer, advance } = setUp();
    warmer.warm(href);
    advance(5 * 60_000);
    await warmer.fetch(href);
    expect(real.mock.calls.filter(([url]) => url === href)).toHaveLength(2);
  });

  it('falls back to a real fetch if warming failed', async () => {
    const { real, warmer } = setUp();
    real.mockRejectedValueOnce(new Error('offline'));
    warmer.warm(href);
    const response = await warmer.fetch(href);
    expect(response.ok).toBe(true);
  });

  it('leaves other pages and other methods alone', async () => {
    const { real, warmer } = setUp();
    warmer.warm(href);
    await warmer.fetch(href, { method: 'POST' });
    await warmer.fetch('/skill/contents/');
    expect(real).toHaveBeenCalledWith(href, { method: 'POST' });
    expect(real).toHaveBeenCalledWith('/skill/contents/', undefined);
  });
});
