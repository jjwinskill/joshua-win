// The Worker's decisions, kept free of the Workers runtime so they're unit-tested in plain Vitest.

const BASE_PATH = '/skill/';
const SITE_ROOT = '/skill'; // BASE_PATH without its trailing slash

// Hosts that only ever serve local dev and tests, so they keep plain http.
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]']);

const isLocal = (url: URL): boolean => LOOPBACK.has(url.hostname);

export type Outcome = { kind: 'redirect'; location: string } | { kind: 'asset' };

export function route(url: URL): Outcome {
  // www only changes the host (G19): the path keeps going, so a missing page on www still
  // reaches the real 404. One hop: the redirect already lands where the bare domain would send it.
  if (url.hostname.startsWith('www.')) {
    const bare = new URL(url);
    bare.hostname = url.hostname.slice('www.'.length);
    const next = route(bare);
    return {
      kind: 'redirect',
      location: next.kind === 'redirect' ? next.location : secure(bare).href,
    };
  }

  if (url.pathname === SITE_ROOT) {
    return { kind: 'redirect', location: secure(new URL(`${BASE_PATH}${url.search}`, url)).href };
  }

  if (!url.pathname.startsWith(BASE_PATH)) {
    return { kind: 'redirect', location: secure(new URL(BASE_PATH, url)).href };
  }

  if (url.protocol === 'http:' && !isLocal(url)) {
    return { kind: 'redirect', location: secure(url).href };
  }

  return { kind: 'asset' };
}

// Every public host is https-only; local dev and tests stay on the origin they asked for.
function secure(url: URL): URL {
  const target = new URL(url);
  if (!isLocal(target)) target.protocol = 'https:';
  return target;
}
