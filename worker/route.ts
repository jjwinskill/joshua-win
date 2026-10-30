// The Worker's decisions, kept free of the Workers runtime so they're unit-tested in plain Vitest.
// The invite gate (#4) extends this with cookies and gate settings.

export const BASE_PATH = '/skill/';

export type Outcome = { kind: 'redirect'; location: string } | { kind: 'asset' };

export function route(url: URL): Outcome {
  if (url.hostname.startsWith('www.')) {
    const canonical = new URL(url);
    canonical.protocol = 'https:';
    canonical.hostname = url.hostname.slice('www.'.length);
    // Keep a path that's already on the site; send anything else to the home page.
    if (!url.pathname.startsWith(BASE_PATH)) {
      canonical.pathname = BASE_PATH;
      canonical.search = '';
    }
    return { kind: 'redirect', location: canonical.href };
  }

  if (url.pathname === BASE_PATH.slice(0, -1)) {
    return { kind: 'redirect', location: new URL(`${BASE_PATH}${url.search}`, url).href };
  }

  if (url.pathname.startsWith(BASE_PATH)) {
    return { kind: 'asset' };
  }

  return { kind: 'redirect', location: new URL(BASE_PATH, url).href };
}
