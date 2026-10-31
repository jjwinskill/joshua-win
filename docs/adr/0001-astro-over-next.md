---
status: accepted
---

# Astro with ClientRouter, not Next

Bake-off 1 (S2, G28, G29) built the same pages in Astro 7.4.4 and Next 16.4.3 and measured both on Cloudflare Worker Previews. Josh chose Astro on 2026-10-31, as the gate also found. Astro's pages load faster and ship less JS, and its card transition also runs on browser back, which Next's didn't in Chromium or Simulator Safari.

## The gate

Medians of three runs, alternating builds. Next needed to beat Astro by 20% on two metrics on the same page. It beat one.

| Page | Metric | Astro | Next | Beaten by 20%? |
|---|---|---|---|---|
| Essay | LCP | 1,402 ms | 2,481 ms | No |
| Essay | TBT | 2 ms | 31 ms | No |
| Essay | INP | 40 ms | 32 ms | Yes, by one 8 ms step |
| Heavy | LCP | 1,334 ms | 2,398 ms | No |
| Heavy | TBT | 0 ms | 13 ms | No |
| Heavy | INP | 72 ms | 80 ms | No |

The transition's condition didn't apply, because the card morphs in both.

## Outside the gate

- **JS on load, compressed:** 6.3 KB against 147.6 KB on the home page, 81.7 KB against 147.5 KB on the essay, and 85.9 KB against 147.5 KB on the heavy page. three.js loads only near the scene in both, at about 131 KB and 133 KB gzipped.
- **Browser back:** Astro's morphs in Chromium, Simulator Safari and Josh's phone. Next's doesn't animate in Chromium or Simulator Safari. Its router uses `popstate`, and React skips view transitions started from that event.
- **Tap to finished morph:** Next is about 150–270 ms faster after the page settles, because it has prefetched the essay. Astro only prefetches on hover.
- **By eye on a phone:** Josh couldn't tell the two apart on the heavy page's performance. That was before the per-element transition and `<ClientRouter />`.

## What Next taught us

Astro's first build used native cross-document view transitions, as `docs/research/route-transitions.md` recommended. In Chrome on iOS, the page jumped about 95 pt on each navigation. Next's same-document transition was smooth there, and that led to the fix. A build with no transition still jumped, so the jump comes from Chrome's full-page navigation.

So Astro now uses `<ClientRouter />` (G34). In Josh's phone test the jump went away everywhere except Chrome's own back arrow. See `docs/research/ios-chrome-view-transitions.md`.

## Consequences

- Pages swap without a reload, so anything that sets up listeners must clean up on unmount, and needs a test that reaches it from another page.
- Astro's bug #18377, where Back leaves the site in Chrome on iOS, is still open. It didn't appear in Josh's test. Recheck it after each Astro upgrade.
- The Next branch and its preview are deleted, and no Next dependency ever reached `main`.

The numbers are from one day on one set of lorem pages, and the phone results from one phone. Lighthouse LCP swung by up to about 1,200 ms between runs of one page, though this run and two earlier ones on the native-transition build all gave the same gate result.
