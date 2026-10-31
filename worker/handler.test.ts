import { describe, expect, it, vi } from 'vitest';
import { handle, type Assets } from './handler';

const assetsReturning = (response: Response): Assets => ({ fetch: async () => response });
const failingAssets: Assets = {
  fetch: async () => {
    throw new Error('assets binding down');
  },
};

describe('handle', () => {
  it('serves the asset with noindex added, keeping its own headers', async () => {
    const asset = new Response('<h1>hi</h1>', {
      headers: { 'Content-Type': 'text/html', ETag: '"a"' },
    });
    const response = await handle(new Request('https://joshua.win/skill/'), assetsReturning(asset));
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    expect(response.headers.get('ETag')).toBe('"a"');
    expect(await response.text()).toBe('<h1>hi</h1>');
  });

  it('redirects with a 301 and noindex, without touching the assets', async () => {
    const response = await handle(new Request('https://joshua.win/'), failingAssets);
    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://joshua.win/skill/');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
  });

  it('turns a failure into a 500 that still carries noindex', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await handle(new Request('https://joshua.win/skill/'), failingAssets);
    expect(response.status).toBe(500);
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    expect(logged).toHaveBeenCalledOnce();
    logged.mockRestore();
  });
});
