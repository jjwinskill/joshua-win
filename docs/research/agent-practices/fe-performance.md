# Front-end performance guidance, as of 2026-11-02

Every claim has a URL fetched this session, with the date the page showed. "Page undated" means the page showed none. No SEO blog is used as a source. Statements marked (unsourced) come from my memory, not a fetch.

Repo baseline (read): LCP 2500 / CLS 0.1 / TBT 200 asserted in `lighthouserc.cjs`; INP 200 and CLS 0.1 in `tests/perf/limits.ts`; no JS cap (G30, docs/plan.md). Fonts: one hand-subset Bricolage woff2, piece 3 only (`content/lorem/one-offs/ut-labore.css`); everywhere else is a system stack (`src/styles/site.css:1-12`). No raster images. The Worker sets immutable on `/skill/_astro/` (`worker/handler.ts:24-34`).

## Ranked by likely gain here

### 1. `run_worker_first: true` has real costs (`wrangler.jsonc:30`)
- Older assumption: a Worker in front of static assets is free, and Pages-style `_headers` and Cloudflare speed features still apply.
- Now:
  - Static asset requests are free and unlimited. A request matching `run_worker_first` invokes the Worker and is billed as a Worker request. Negative patterns (`!/...`) skip the Worker. https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ (updated 2026-04-23)
  - `_headers` rules do not apply to responses your Worker generates, and the docs say to set headers in the Worker. https://developers.cloudflare.com/workers/static-assets/headers/ (updated 2026-09-22)
  - Speed Brain (Cloudflare's speculation-rules prefetch, on by default on Free) skips routes that run a Worker. https://developers.cloudflare.com/speed/optimization/content/speed-brain/ (updated 2026-08-14)
- Repo: follows the headers advice, since caching is set in the Worker. It pays the Worker cost on every asset because noindex needs it (S18). After launch noindex goes away, so narrowing `run_worker_first` to an array, or dropping it, is the biggest cheap change. Unverified: whether `_headers` applies to `ASSETS.fetch()` responses. The binding doc is silent (https://developers.cloudflare.com/workers/static-assets/binding/, updated 2026-10-12).

### 2. Soft navigations: field metrics now split per page view
- Older assumption: an SPA-style router reports one LCP, CLS and INP for the whole session.
- Now: Chrome 151 and Edge 151 enable soft navigation measurement by default. CLS and INP reset at each soft navigation, and LCP uses `interaction-contentful-paint`. CrUX gets experimental soft-nav metrics, planned stable May 2027. `web-vitals` v6+ has `reportSoftNavs: true`. Firefox and Safari don't support it. The article doesn't mention Astro. https://developer.chrome.com/docs/web-platform/soft-navigations-experiment (updated 2026-09-20)
- Repo: `<ClientRouter />` (`src/layouts/Base.astro:61`) is History-API navigation, so this applies. There is no RUM beyond the Cloudflare beacon (G18). Whether that beacon counts soft navs is unverified. Lab checks (`tests/perf/`) measure one session, so they already cover the card transition. Nothing to change for launch. If RUM is added, use `web-vitals` with `reportSoftNavs`.

### 3. Lighthouse is two majors ahead of the repo's pin
- Older assumption: Lighthouse 10 weights (FCP 10, SI 10, LCP 25, TBT 30, CLS 25), and INP is not in the lab score.
- Now:
  - Latest is 13.6.0 (2026-10-27). The notes list no performance-score or weight changes in v13.x. They add LCP-simulation fixes, agentic-browsing/llms.txt audits, and a baseline-compatibility audit. https://github.com/GoogleChrome/lighthouse/releases
  - v13.0.0 removed `preload-fonts`, `uses-rel-preload`, `offscreen-images`, `font-size`, `no-document-write` and others, replacing them with insights. It needs Node 22.19+ (fine on Node 26). https://github.com/GoogleChrome/lighthouse/releases/tag/v13.0.0 (page shows "10 Oct", no year)
  - The scoring doc still lists the v10 weights. Page undated. https://developer.chrome.com/docs/lighthouse/performance/performance-scoring
  - TBT bands: mobile 0-200 good, 200-600 moderate. Page undated. https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time
  - `@lhci/cli` latest release listed is 0.15.1 (26 Jun, year not shown); 0.15.0 (9 Jun 2025) bundled Lighthouse 12.6.1. https://github.com/GoogleChrome/lighthouse-ci/releases (I could not confirm which Lighthouse 0.15.1 bundles.)
- Repo: `lighthouserc.cjs:1-2` pins @lhci/cli 0.15.1 / Lighthouse 12.6.1. The three assertions use audits that still exist, so they are not broken. Scores from the CLI may differ from today's PageSpeed Insights (Lighthouse 13). Add a note to G38, or compare once at a checkpoint.

### 4. Scroll-driven animations are now in all three engines (new this week)
- Older assumption: Chrome-only, needs a polyfill, can't depend on it on phones.
- Now:
  - Firefox 159 (released 2026-10-27) enables them by default. https://developer.mozilla.org/Firefox/Releases/159
  - Safari 26 shipped `animation-timeline: view()` and `animation-range` (2025-09-15; iOS 26 is implied, the post doesn't say). https://webkit.org/blog/17333/webkit-features-for-safari-26-0/
  - Chrome has had them since 115, and Chrome's doc lists Firefox 159 and Safari 26. https://developer.chrome.com/docs/css-ui/scroll-driven-animations (undated)
  - They can run off the main thread. The doc's example animates `transform` rather than `width` so it composites. It doesn't list other compositable properties.
  - MDN's `animation-timeline` page still says "not Baseline". https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline
- Repo: robot keyframes animate only transform and opacity (`src/styles/robot.css:271-397`), which is the right shape. The `@supports (animation-timeline: view())` plus reduced-motion gate (`robot.css:197`) is still correct: iOS before 26 and Firefox before 159 stay on the fallback. Check the robot on Firefox 159 and Safari 26 phones; the Playwright projects are Chromium only (`playwright.config.ts:22`, perf is Pixel 7).

### 5. View transitions: Firefox now runs the same-document kind
- Older assumption: Chrome and Safari only.
- Now: same-document is Chrome 111, Firefox 144, Safari 18. Cross-document is Chrome 126 and Safari 18.2; Firefox has no support. https://developer.chrome.com/docs/web-platform/view-transitions (undated)
- Costs: I found no official figure for snapshot memory or GPU cost. MDN says only that it captures a static old state and a live new state. https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API (undated). WebKit 27.0 fixed a canvas that vanished for a frame and a slow iPhone page load from large blur radii. https://webkit.org/blog/18325/webkit-features-for-safari-27-0/ (2026-09-17)
- Repo: `site.css:286-287` says browsers without support swap with no morph. That is now true only of old Firefox. Firefox users will see the morph, so test Firefox. The card transition uses `view-transition-class` (`site.css:276`), which is fine. Keep checking on a real iPhone (Josh's rule).

### 6. `content-visibility: auto` is Baseline and unused here
- Older assumption: Chrome-only, risky.
- Now: Baseline Newly available since 2025-09-15 (Chrome 85, Firefox 125, Safari 18). Pair it with `contain-intrinsic-size: auto <guess>`. The article's example cut load rendering from 232 ms to 30 ms and says INP can improve. Skipped content stays in find-in-page and the a11y tree. https://web.dev/articles/content-visibility (published 2020-08-05; the Baseline note is in the page) and https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility
- Repo: not used (grep). Likely gain is on the heavy page's below-fold sections, not essays. Risk (my inference, unsourced): skipped sections get size and paint containment, which may disturb the sticky stage and view-timeline in `robot.css`. Test before adopting.

### 7. Fonts: already near best practice
- Older assumption: preload everything, `font-display: swap` is enough.
- Now:
  - Preload only the key fonts, since it ignores `unicode-range`. Put `@font-face` in the head. Use `size-adjust`, WOFF2, subsetting. `optional` is the most performance-focused display value. https://web.dev/articles/font-best-practices (undated)
  - Astro has a Fonts API with `optimizedFallbacks` and `<Font preload />`. Its docs don't say if it's stable, and name only an `experimental_` helper. https://docs.astro.build/en/guides/fonts/
- Repo: follows it. It has a subset woff2 (21 KB in `dist/skill/_astro/`), a metric-matched fallback with `size-adjust`/`ascent-override` (`ut-labore.css:17-24`), and `swap`. Gap: no preload, so the font is found only after the CSS parses. Piece 3 headings could take one `<link rel=preload as=font crossorigin>`, but its unicode-range makes it a small win. Not worth the Fonts API.

### 8. INP: thresholds unchanged, tooling moved
- Older assumption: FID is gone, TBT is a fair proxy, `isInputPending` helps.
- Now:
  - Good ≤ 200 ms, poor > 500 ms. https://web.dev/articles/inp (updated 2025-09-02)
  - CWV thresholds are 2.5 s / 200 ms / 0.1. https://web.dev/articles/vitals (updated 2024-10-31). LCP poor > 4.0 s: https://web.dev/articles/lcp (updated 2025-09-04)
  - Chromium INP changes in 2026 are small fixes (Chrome 147, 148, 150). https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/inp.md (no dates on page)
  - `isInputPending` is no longer recommended. `scheduler.yield()` is Chrome 129, Firefox 142, not Safari, so keep a `setTimeout` fallback. https://web.dev/articles/optimize-long-tasks (updated 2024-12-19)
  - Web searches turned up SEO blogs claiming a 2026 LCP of 2.0 s or a new metric. Nothing primary backs them, and no Google source in this session mentions a change. Treat as unchanged. This is absence of evidence, not proof.
- Repo: the 200 ms INP line is measured by the throttled Playwright checks (G30, `tests/perf/`), correct since Lighthouse can't measure INP. Parade, Swirl and charts code should yield with `scheduler.yield?.() ?? setTimeout`.

### 9. Speculation rules and prefetch: low gain here
- Older assumption: add `<script type="speculationrules">` with prerender for instant pages.
- Now: Chrome and Edge 109+ prerender; document rules with `eagerness` 121+; Firefox no; Safari behind a flag. Prerender is a hint. Prerendered pages run JS (a problem for canvas and analytics), so use the `Speculation-Rules` header or script, with `document.prerendering` guards. https://developer.chrome.com/docs/web-platform/prerender-pages (updated 2026-10-29); https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API (undated, "limited availability")
- Repo: `src/lib/warm-pages.ts` already fetches likely pages at low priority for the router. Speculation rules cover full-document navigations, and the ClientRouter does soft ones, so the gain is small (my inference). Astro's `prefetch` defaults to `prefetchAll` under ClientRouter; `clientPrerender` is experimental. https://docs.astro.build/en/guides/prefetch/ (undated). Skip prerender.

### 10. Caching headers: the repo is right
- Now: default is `public, max-age=0, must-revalidate` plus a content-hash ETag. A Worker-set `immutable` on hashed files is the supported route when the Worker runs first. https://developers.cloudflare.com/workers/static-assets/headers/ (updated 2026-09-22)
- Repo: `handler.ts:24-34` does it for `/skill/_astro/` (18 files, none unhashed). HTML stays revalidating, which suits a deployed static site. Not verified: Brotli/zstd, Early Hints (the static-assets page is silent; the Early Hints page excerpt had no detail, updated 2026-04-16).

### 11. Images: n/a today
- Now (MDN): JPEG XL Chrome 155, Firefox 158, Safari 17 (Safari decodes only after full download). AVIF Chrome 85, Safari 16.1, Firefox 93. Prefer WebP or AVIF for photos, SVG for diagrams, with a `<picture>` fallback. https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types (undated). Web-search coverage of JXL conflicted on dates, and I couldn't fetch Chrome 155 notes (404), so rely on MDN's table.
- Repo: the cast and charts are SVG and there are no raster images, so nothing to do. If photos come later, use AVIF with WebP/JPEG fallback; skip JXL.

## Design tokens (phase 4)
- DTCG: format 2025.10 is stable per the community group (announced 2025-10-28). It is a Community Group Final Report, not a W3C Recommendation. The 2026-09-08 editor's draft says it isn't on the W3C Standards Track and not to treat it as authoritative. Tools reported as supporting it as of June 2026: Figma, Penpot, Sketch, Tokens Studio, Style Dictionary, Terrazzo. Aliases are `{group.token}`; color is `colorSpace` + `components`. https://www.w3.org/community/design-tokens/ and https://www.designtokens.org/tr/drafts/format/ (2026-09-08)
- `light-dark()`: Baseline 2024 (since May 2024). It needs `color-scheme: light dark` on `:root`; `color-scheme: light|dark` overrides per element, which is how a manual toggle can work. Image arguments are in WebKit 27.0, so treat as new (2026-09-17). https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark and https://webkit.org/blog/18325/webkit-features-for-safari-27-0/
- `color-mix()`: Widely available since May 2023. MDN prefers `oklab`/`oklch` over `srgb`, which "often gives overly dark or grayish results". It accepts more than two colors, and WebKit 27.0 lists this too. https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix
- `@property`: Baseline 2024 (since July 2024). Whether animating registered properties stays on the main thread was not in the MDN page; I believe it does (unsourced). https://developer.mozilla.org/en-US/docs/Web/CSS/@property
- Repo: `site.css:1-23` sets `color-scheme: light dark` and repeats each variable in a `prefers-color-scheme` block. `light-dark()` halves that and allows a user toggle without duplicating blocks. `color-mix` is used in `srgb` in `site.css:209` and `robot.css:155`, and in `oklch` in `umbrella.css:109-113`. For the theme, define tokens once as custom properties, derive tints with `color-mix(in oklch, ...)`, and keep a DTCG JSON only if a tool such as Style Dictionary will read it. Otherwise it is an extra layer.

## Not covered
No fetch for: Safari/Firefox INP support, Cloudflare compression details, view-transition memory numbers, caniuse tables (the page returned none).
