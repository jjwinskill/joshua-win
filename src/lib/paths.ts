// Builds site-internal hrefs under Astro's `base` (/skill/). Never hard-code a leading `/`:
// it would drop the base, and the Worker (#3) will send anything outside /skill/ back to the home page.
// The path is passed through as written: give pages their trailing slash (`essays/`), because the site
// uses `trailingSlash: 'always'` and a slashless page link costs a redirect on Cloudflare and is a 404 in `astro dev`. Files (`og.png`) take none.
export function sitePath(path = '', base: string = import.meta.env.BASE_URL): string {
  const root = base.endsWith('/') ? base : `${base}/`;
  const relative = path.replace(/^\/+/, '');
  return `${root}${relative}`;
}
