# Route transitions in Astro and Next (as of 2026-10-31)

Best practice for the card that expands into its piece (N1), written before any transition code (#28). Sources are linked per claim. "Tested" means the two throwaway probes described below, which were not kept.

## Recommendation

| | Astro | Next |
|---|---|---|
| **Approach** | Native cross-document view transitions, in CSS only. No `<ClientRouter />`. | `<Link>` with React's `<ViewTransition name>`. No config. |
| **JS needed for the transition** | None | The React and Next runtime |
| **Forward morph** | Works in Chromium and iOS Safari (tested) | Works in Chromium and iOS Safari (tested) |
| **Browser back button** | Morphed in Chromium and iOS Safari (tested on a short page) | **Didn't morph** in Chromium or iOS Safari (tested on a short page) |
| **Reduced motion** | Wrap the opt-in in a media query (tested in Chromium) | Add CSS yourself: without it, the morph still ran (tested in Chromium). The fix is untested. |

**This doesn't change the spec's minimum approach for either framework, but Next missed #27's definition of "works".** That definition is "forward and back in Chromium and iOS Safari". In the probe, Next's morph ran forward only. So #35 reports back navigation instead of requiring it, and it's up to Josh whether that matters when he reads the bake-off report. The gate's transition condition (Next works and Astro doesn't) can't fire if the real pages behave like the probes.

## What was tested

A minimal two-card home page and two short essay pages in each framework: Astro 7.4.4, and Next 16.4.3 with React 19.3.1 as a static export (`output: 'export'`). Both were served under `/skill/` from a local server, not through the Worker or a deployed preview.

- **Chromium:** Playwright 1.64.1 headless, phone viewport, 4x CPU throttling. It recorded the `::view-transition-group` pseudo-elements that animated.
- **iOS Safari:** the iOS 27.2 Simulator on an iPhone 18 Pro, with transitions slowed to 6 s, read from screenshots taken mid-flight. Safari's on-screen back button was used.

| Probe | Forward | Browser back | Second card |
|---|---|---|---|
| Astro, Chromium | `root`, `piece-a` | `root`, `piece-a` | `root`, `piece-b` |
| Astro, Chromium, reduced motion | none | none | none |
| Next, Chromium, tapped at once | `root`, `piece-a` | none | `root`, `piece-b` |
| Next, Chromium, tapped after 1.5 s | `root`, `piece-a` | none | `root`, `piece-b` |
| Next, Chromium, reduced motion, no CSS for it | `root`, `piece-a` | none | `root`, `piece-b` |
| Astro, iOS Safari | morphs | morphs | not run |
| Next, iOS Safari | morphs | instant, no animation | not run |

**Not tested:**

- Safari's swipe-back gesture
- a real phone
- navigation over a real network, so a slow first tap in Next
- `<Link>`-driven back navigation in Next
- a full home page of cards
- reduced motion in iOS Safari

Going back after scrolling far down an essay wasn't tested by the probes either, and it's what a reader actually does. #32 tested it on the real pages (step 6 below). React forms no pair when either side is offscreen, so #35 must test it too, and #36 covers the rest.

## The platform

- **Cross-document support (Astro's approach):** Chrome 126+, Safari and iOS Safari 18.2+. Firefox has partial support ([caniuse](https://caniuse.com/cross-document-view-transitions)), and Firefox wasn't tested, so we treat it as a normal navigation and don't count it.
- **React's support (Next's approach):** a same-document transition using newer API features, in "Chromium 125+ and recent Safari and Firefox versions". Without support, the app works and the transitions don't animate ([Next](https://nextjs.org/docs/app/guides/view-transitions)).
- **Both pages opt in** with `@view-transition { navigation: auto }`, and they must be same-origin ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using)). Custom `::view-transition-*` styles must be on the destination page, so the shared layout should hold them for both directions (same source).
- **What triggers one:** links, form submissions and back/forward. Not the address bar, bookmarks or reload ([Chrome](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document), [CSS View Transitions 2 draft](https://www.w3.org/TR/css-view-transitions-2/)).
- **Names must be unique** on a page, or the transition is skipped (MDN, above).
- **Slow pages lose the transition:** Chrome skips it after four seconds (Chrome, above). The spec leaves the duration to each browser.
- **Swipe back:** a 2025 [report to the CSS Working Group's list](https://lists.w3.org/Archives/Public/public-css-archive/2025May/0286.html) says Safari 18.4's swipe-back seems to suppress author transitions, and that it couldn't find this specified. If that still holds, iPhone readers who swipe won't see Astro's back morph either. We shouldn't try to fight it, since the browser draws its own.
- **`pageswap` and `pagereveal`:** copies of [Chrome's article](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document) list different Safari versions for these (18.2 and 26.2). The iOS 27.2 Simulator has `onpagereveal`. Nothing essential should depend on them.

## Astro

- Astro's docs describe native transitions as adding animation without changing scripts or adding JS, and say `<ClientRouter />` turns the site into a single-page app, may need scripts reinitialized, and adds fallbacks and persistent elements. They suggest checking whether you still need it as browser APIs evolve ([Astro](https://docs.astro.build/en/guides/view-transitions/), which doesn't state a version).
- **We don't need `<ClientRouter />`:** the morph runs in the browsers we target, and unsupported browsers navigate normally. It would add JS to every page and make the parade handle client-side navigation, for no gain here. Revisit only if a later piece needs state to persist across pages.

**Do this in #32:**

1. In the shared layout: `@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }`.
2. Give the card and the essay's matching element the same `view-transition-name`, built from the piece's slug. Every name is then unique per page.
3. Set the names in the markup, built from the slug, so they're present with no JavaScript. Chrome and MDN suggest clearing names for bfcache where they'd clash. Ours don't clash.
4. Keep it simple until measured: Chrome warns to measure before using `<link rel="expect" blocking="render">`.
5. Test it in Chromium through Playwright, checking that `::view-transition-group(piece-…)` animated, as the probe did.
6. Check going back from the bottom of an essay. **Done in #32:** the header flew in from over 6,000 px away on a real page, so a small inline script drops the name from anything off screen on `pageswap` and `pagereveal`, and the page crossfades. Checked in Chromium through Playwright and by eye in iOS 27.2 Simulator Safari, using the on-screen back button. Browsers without those events would keep the fly-in, and swipe back is still untested.

## Next

- `<ViewTransition>` works in the App Router with no configuration, and route navigations count as transitions. The same `name` on both pages forms the morph. Next's guide warns that the morph needs the destination to render in the same commit, which prefetched pages do. If it suspends into a fallback first, no pair forms ([Next](https://nextjs.org/docs/app/guides/view-transitions), updated 2026-10-15).
- The guide says some animations may behave differently in Safari (same source). The basic morph ran in the probe.
- **Browser back:** Next's guide says browser back carries no transition type but that the morph still applies. **The probe contradicts it: no morph on browser back, in Chromium or Safari.** The likely cause, inferred and not proven, is React's caveat that it skips animations started from the legacy `popstate` event unless the router uses the Navigation API ([React](https://react.dev/reference/react/ViewTransition)). No official source says whether Next can do this today, so #35 should check. A `<Link>` back to the home page should morph, per the guide, but wasn't tested.
- **Reduced motion:** React doesn't disable animations itself and recommends a media query (React, above). The probe confirms it: the morph ran with reduced motion on. Next's guide gives the CSS, setting `animation-duration: 0s` on the view-transition pseudo-elements.
- Names must be unique across the whole mounted app, and duplicates error. A pair isn't formed if either side is outside the viewport (React, above).
- A static export includes a "static payload for client navigation" ([Next](https://nextjs.org/docs/app/guides/static-exports)), and the probe's export had `.txt` payload files. Next's view transitions guide doesn't mention static export. How fast those payloads arrive is part of what #36's cold and warm runs should show.

**Do this in #35:**

1. Use `<Link>` and `<ViewTransition name>` from `react`, with the same slug-built names, on the card and the essay's matching element.
2. Add the reduced-motion CSS.
3. Add the guide's `default="none"` and `share` pairing to the cards: without `default="none"`, every named `<ViewTransition>` animates on any transition. Set both together, or the pair silently stops morphing.
4. Report what these do: browser back, a `<Link>` back to home, and each of them from the bottom of an essay. Check whether Next can use the Navigation API for this.

## Don't use

- **Plain `<a>` tags and shared CSS in Next.** It would work, but it throws away what Next offers and would tie by construction (#27).
- **`<ClientRouter />`** in Astro, for the reasons above.
- **The [Next 15 `experimental.viewTransition` flag](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/viewTransition).** The current guide says no configuration is needed, and it wasn't set in the probe.

## Sources checked on 2026-10-31

- [Next: Designing view transitions](https://nextjs.org/docs/app/guides/view-transitions), updated 2026-10-15
- [Next: Static exports](https://nextjs.org/docs/app/guides/static-exports), updated 2026-08-09
- [React: `<ViewTransition>`](https://react.dev/reference/react/ViewTransition), and [the React 19.3 post](https://react.dev/blog/2026/09/09/react-19-3), which calls it stable
- [Astro: View transitions](https://docs.astro.build/en/guides/view-transitions/)
- [Chrome: Cross-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document), whose page says it was last updated 2024-04-14
- [MDN: Using the View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using), modified 2026-09-15
- [CSS View Transitions Level 2](https://www.w3.org/TR/css-view-transitions-2/), Working Draft of 2024-11-13
- [caniuse: cross-document view transitions](https://caniuse.com/cross-document-view-transitions)
