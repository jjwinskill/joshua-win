// The router fetches a page before its transition can start, which a reader feels as a lag after the tap.
// So the pages a reader is likely to open next are fetched ahead of time, and the router's fetch takes the
// copy. It's one copy per fetch, and an old one is ignored, so the page after a deploy isn't stale for long.
const maxAge = 30 * 60_000;

type Fetch = typeof fetch;
type Entry = { at: number; response: Promise<Response> };

const stylesheets = (html: string) =>
  [...html.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) =>
      /\brel="stylesheet"/.test(tag) ? /\bhref="([^"]+)"/.exec(tag)?.[1] : undefined,
    )
    .filter((href) => href !== undefined);

export function createPageWarmer(realFetch: Fetch, now: () => number = Date.now) {
  const pages = new Map<string, Entry>();
  const sheets = new Set<string>();
  const isFresh = (entry: Entry | undefined): entry is Entry =>
    !!entry && now() - entry.at < maxAge;

  return {
    warm(href: string) {
      if (isFresh(pages.get(href))) return;
      const response = realFetch(href, { priority: 'low' });
      pages.set(href, { at: now(), response });
      // The router waits for a page's stylesheets too, so have those in the cache as well.
      response
        .then((page) => page.clone().text())
        .then((html) => {
          for (const sheet of stylesheets(html)) {
            if (sheets.has(sheet)) continue;
            sheets.add(sheet);
            realFetch(sheet, { priority: 'low' }).catch(() => undefined);
          }
        })
        .catch(() => undefined);
    },

    fetch: ((input: RequestInfo | URL, init?: RequestInit) => {
      const href = input instanceof Request ? undefined : new URL(input, location.href).href;
      const entry = href === undefined ? undefined : pages.get(href);
      // Only the router passes a signal. Astro's own prefetch mustn't use up the copy.
      if (href === undefined || !init?.signal || init.method || !isFresh(entry)) {
        return realFetch(input, init);
      }
      pages.delete(href);
      return entry.response.catch(() => realFetch(input, init));
    }) as Fetch,
  };
}

// The cards in view, and the way back home from a piece. Scripts live through page swaps (G34), so this
// runs once, and each page drops the last page's observer.
export function warmPages() {
  if ((navigator as { connection?: { saveData?: boolean } }).connection?.saveData) return;
  const warmer = createPageWarmer(window.fetch.bind(window));
  window.fetch = warmer.fetch;
  let observer: IntersectionObserver | undefined;

  document.addEventListener('astro:page-load', () => {
    observer?.disconnect();
    const seen = new IntersectionObserver((entries) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        warmer.warm((target as HTMLAnchorElement).href);
        seen.unobserve(target);
      }
    });
    observer = seen;
    for (const card of document.querySelectorAll('a.piece-card')) seen.observe(card);
    const home = document.querySelector<HTMLAnchorElement>('.site-nav a');
    if (home && document.querySelector('.piece-sheet')) warmer.warm(home.href);
  });
}
