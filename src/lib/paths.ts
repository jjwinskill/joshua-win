// Builds site-internal hrefs under Astro's `base` (/skill/). Never hard-code a leading `/`:
// it would drop the base, and the Worker sends anything outside /skill/ back to the home page.
export function sitePath(path = '', base: string = import.meta.env.BASE_URL): string {
  const root = base.endsWith('/') ? base : `${base}/`;
  const relative = path.replace(/^\/+/, '');
  return `${root}${relative}`;
}
