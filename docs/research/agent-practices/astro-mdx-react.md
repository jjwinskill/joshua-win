# Astro 7 / MDX / React 19.x traps for joshua.win/skill

Researched 2026-11-02. Installed (node_modules): astro 7.4.4, @astrojs/react 7.1.2, @astrojs/mdx 8.1.2, react 19.3.1, eslint-plugin-react-hooks 7.1.1. Sources are docs pages fetched this session (list at the bottom, [n] = source number). Nothing here comes from memory. Items marked UNVERIFIED were not confirmed in a fetched page.

## Ranked traps

| # | Older model would write | Correct now | Applies to | Repo status |
|---|---|---|---|---|
| 1 | `markdown: { remarkPlugins: [...] }` or `mdx({ remarkPlugins })`, assume unified/remark is the pipeline | Sätteri is the default Markdown and MDX processor since Astro 7. Plugins go in `satteri({ mdastPlugins, hastPlugins })`; unified is opt-in and not bundled (`@astrojs/markdown-remark`, `unified()`). `mdx({ processor })` exists since @astrojs/mdx 6.0.0. `recmaPlugins` is deprecated and needs `unified()`. [1][2][3] | Astro 7, mdx 8.1.2 | OK. `astro.config.mjs:35` uses `mdx({ processor: satteri({ mdastPlugins: [castMentionsPlugin] }) })`. Plugin is node-keyed (`src/lib/mdx-mentions.ts:27-33`), the Sätteri shape. |
| 2 | `.astro` templates with sloppy HTML: unclosed `<p>`, `<div>` inside `<p>`, `<li>` with no close | The Rust compiler (default and only compiler in 7) errors on unclosed non-void tags and no longer repairs bad nesting. [1] | Astro 7 | OK by inspection: grep found no `<p>` in .astro files and build passes. Re-check any new `.astro` markup. |
| 3 | Rely on whitespace between inline elements (`<span>a</span> <em>b</em>`) | `compressHTML` default is now `'jsx'`: JSX whitespace rules, so newlines between inline elements vanish. Use `{" "}` or set `compressHTML: true`. [1] | Astro 7 | Checked: `.site-nav` is flex with gap (`src/styles/site.css:75-81`), so no visible risk. Watch for any new inline run in .astro. React `.tsx` was never affected. |
| 4 | `import { ViewTransitions } from 'astro:transitions'` | `ClientRouter` (rename in 5, `ViewTransitions` removed in 6). Also removed in 6: `handleForms` prop, `prefetch(..., { with: 'fetch' })`. [4][5][6] | 5, 6 | OK. `src/layouts/Base.astro:2,61`. |
| 5 | Import `TRANSITION_*` constants, `isTransitionBeforeSwapEvent`, `createAnimationScope` from `astro:transitions/client` | Removed (deprecated in 6, gone in 7). Use event-name strings: `'astro:before-preparation'`, `'astro:after-swap'`, `'astro:page-load'`. [4][5] | 7 | OK. `Base.astro` and `src/lib/warm-pages.ts:61` use strings. |
| 6 | `DOMContentLoaded` for per-page setup; assume bundled `<script>` reruns on each navigation | With ClientRouter, bundled module scripts run once; inline scripts can rerun, `data-astro-rerun` forces a rerun. Per-page setup belongs in `astro:page-load` (fires on first load too). `astro:after-swap` fires before paint and before new scripts run. [6] | 3.6+ | OK. `warmPages()` runs once from a bundled script and re-binds on `astro:page-load` (`warm-pages.ts:61`). `Base.astro:67-110` inline listeners are guarded by "router doesn't re-run seen inline scripts", consistent with [6]. |
| 7 | `import { z } from 'astro:content'` or `from 'zod'`; Zod 3 idioms (`z.string().email()`, `.default("0")`, `{ message }`) | `import { z } from 'astro/zod'` (Zod 4). Use `z.email()`, `{ error }`, `.prefault()` for the old default semantic. [3][5][7] | 6+ | OK. `src/content.config.ts:3`. No removed Zod 3 idioms. `.default([])` on an array is fine in Zod 4. |
| 8 | `src/content/config.ts`, `type: 'content'`, `post.slug`, `post.render()`, `getEntryBySlug`, `Astro.glob()` | `src/content.config.ts`, `loader: glob({ pattern, base })` from `astro/loaders`, `entry.id`, `render(entry)` from `astro:content`, `import.meta.glob(..., { eager: true })`. Legacy flag removed in 6. Collection order is not deterministic; sort yourself. [5][7][8] | 5, 6 | OK. `content.config.ts:2,10,17`; `Piece.astro:4,18`; `piece-cast.ts:1`. Sorting done by `newestFirst` in `src/lib/pieces.ts` (not read). |
| 9 | Hand-rolled `@font-face` plus `<link>` preload; Fontsource imports | Fonts API: `fonts: [{ provider: fontProviders.local()/fontsource()/google(), name, cssVariable }]` from `astro/config`, `<Font cssVariable preload />` from `astro:assets`. Experimental in 5.x, stable in 6. Auto fallbacks, caching, self-hosted. [5][9] | 6+ | NOT USED, by choice probably. `content/lorem/one-offs/ut-labore.css:4,17` hand-writes `@font-face`; `ut-labore.mdx:14` imports the woff2 with `?url`. Works. Only an issue if fonts go site-wide; then use the Fonts API (local provider supports `variants`). |
| 10 | `forwardRef`, `Context.Provider`, `defaultProps`, `propTypes`, `ReactDOM.render`, `findDOMNode`, `react-dom/test-utils`, `useRef()` with no arg, global `JSX.` namespace | React 19: `ref` is a plain prop; `<Context value>`; destructuring defaults; `createRoot`/`hydrateRoot`; `act` from `react`; `useRef(undefined)`; `JSX` is not global (use `React.JSX` or the module declaration). `forwardRef` and `.Provider` still work but are slated for deprecation. [10][11] | 19.0+ | OK. Grep of src/, content/, tests/, vitest.setup.ts found none of these. Ref callbacks use block bodies (`UmbrellaCarousel.tsx:299,313,369`), as 19 requires for TS. |
| 11 | `useEffect` for derived state, resets, event logic, store subscriptions, with `setState` inside | Compute in render; `key` to reset; handlers for events; `useSyncExternalStore` for external stores; Effects only for external-system sync, always with cleanup. `useEffectEvent` (stable in 19.2) splits event logic out of an Effect without adding dependencies; do not use it just to silence the linter. [12][13] | 19.2+ | Good. `PixelBattle.tsx` already uses `useSyncExternalStore`; every effect returns cleanup (spot-checked `Parade.tsx:21-40`). No `useEffectEvent` used and none needed in what was read. Nit: `UmbrellaCarousel.tsx:287` `useEffect(() => moveTo.current(selected), [selected])` returns the call's value; it is typed `void` so fine, but braces are safer (a returned function would be treated as cleanup). |
| 12 | Old hooks lint: only `rules-of-hooks` and `exhaustive-deps` (plugin v4/v5, `plugin:react-hooks/recommended`) | Plugin v6/v7: flat `reactHooks.configs.flat.recommended`, legacy name is `recommended-legacy`. The preset adds React Compiler rules (`set-state-in-effect`, `set-state-in-render`, `refs`, `purity`, `immutability`, `static-components`, `use-memo`, `preserve-manual-memoization`, `incompatible-library`, `globals`, `error-boundaries`, `unsupported-syntax`, `config`, `gating`). `eslint-plugin-react-compiler` is superseded. [12][14][15] | plugin 6+ | OK and ahead. `eslint.config.js:12-14` promotes every `recommended` rule to error. Installed 7.1.1 exports 16 rules (checked by import). `recommended-latest` also exists. |
| 13 | Add `babel-plugin-react-compiler` or `react({ babel: ... })` to enable the Compiler | `@astrojs/react` 7 removed the `babel` option (Oxc/Rolldown now). `react({ compiler: true })` plus dev dep `oxc-transform-react` (docs call it experimental; `compilationMode: 'annotation'` with `"use memo"`). For plain Vite use `@rolldown/plugin-babel` with `reactCompilerPreset` from `@vitejs/plugin-react` 6+. Compiler 1.0 shipped Oct 2025. [14][16][17] | react integration 7+ | Compiler not enabled; the repo keeps manual `useMemo` (`HeavyChart.tsx:11-12`, `UmbrellaCarousel.tsx:65,67`, `PixelBattle.tsx:29,30,75`). Fine. Don't add `babel:` to `react()`. |
| 14 | Pass the island `client:visible` with no thought for options; assume `client:idle` has no timeout | `client:idle={{ timeout: 500 }}` (4.15), `client:visible={{ rootMargin: '200px' }}` (4.1), `client:media`, `client:only="react"`. A `client:*` directive works on framework components in `.astro` and, per the MDX page, in `.mdx`. [18][19] | 4.x+ | OK. Uses `client:idle`/`client:visible` in `Piece.astro:51` and `content/lorem/*.mdx`. All pieces also work with JS off (tests use `javaScriptEnabled: false`). |
| 15 | `Astro.glob`, `output: 'hybrid'`, dynamic `export const prerender = expr`, Squoosh, `<script>` assumed hoisted when conditional | `output: 'hybrid'` removed in 5 (static now allows on-demand routes); conditional scripts need `is:inline`; `Astro.glob` removed in 6; `import.meta.env` is never coerced in 6. [5][7] | 5, 6 | OK. None present. `Base.astro` conditional beacon script already has `is:inline`. |
| 16 | `src/env.d.ts` plus `/// <reference types="astro/client" />`, `tsconfig` extends `astro/tsconfigs/base` w/o strict | Not generated since 5; `include` must have `.astro/types.d.ts`. [5] | 5+ | OK. `tsconfig.json` matches. |
| 17 | Use Astro Actions for any "form handler" | Actions (4.15+): `defineAction` with `z` from `astro/zod`. Form-action path needs on-demand rendering; actions are public endpoints. This site is static plus a hand-written Worker with no adapter. [20] | 4.15+ | Not used. Don't introduce without an adapter. Irrelevant here. |
| 18 | Assume `<Activity>`/`<ViewTransition>` not available; hand-roll | React 19.2: `<Activity mode="visible"|"hidden">`. React 19.3 (2026-09-09): `<ViewTransition>` stable, Fragment refs stable, `browser()` in react-dom. Note: the site's transitions are Astro ClientRouter and CSS `view-transition-name`; React's `<ViewTransition>` only animates Transition updates inside React. `useId` now yields `_r_` ids, valid in `view-transition-name`. [12][21] | 19.2/19.3 | Not used and not needed. Mixing React `<ViewTransition>` with ClientRouter swaps is untested; avoid unless asked. |
| 19 | `<title>` through helper libs inside islands | React 19 hoists `<title>`/`<meta>`/`<link>` from components. Under Astro the `<head>` belongs to `Base.astro`; don't render `<title>` from an island (ClientRouter swaps head itself). [10][6] | 19.0 | OK. |
| 20 | Assume Node 18/20 and Vite 5/6 | Astro 6 needs Node 22.12+. Installed Astro 7.4.4 declares `engines.node >=22.23.4` (read from node_modules) and uses Vite 8 (`vite ^8.3.5`, node_modules; [1] says Vite 8). Repo runs Node 26.13.0. [1][5] | 6, 7 | OK. |

## Repo violations found

None that would break the build or ship dated code. Everything above marked OK was checked by grep or file read. Small items only:

1. `src/components/charts/UmbrellaCarousel.tsx:287`: `useEffect(() => moveTo.current(selected), [selected])` implicitly returns the call's value. Harmless today (`void`), but a block body avoids an accidental cleanup function. Style, not a defect.
2. `content/lorem/one-offs/ut-labore.css:4,17` and `ut-labore.mdx:14`: hand-written `@font-face` and a `?url` import instead of the Fonts API. Valid; only revisit if fonts become site-wide. [9]
3. `astro.config.mjs:35` pins `@astrojs/markdown-satteri` 0.4.6 explicitly. The docs say Sätteri works with no install and the package is for configuring it or adding plugins, which this repo does. Correct. Keep the version pinned and re-check it with Astro bumps; the repo's own comment records satteri 0.10.5 (`mdx-mentions.ts:28`).
4. UNVERIFIED: `Base.astro:100` uses `event.viewTransition` on `astro:before-swap`, and `event.loader`/`event.navigationType` on `astro:before-preparation` (`Base.astro:40-41`). The fetched View Transitions page lists these events and the `direction` and `newDocument`/`swap` properties but not `viewTransition`, `loader` or `navigationType`. The code carries its own comment citing Astro issue #18377 and is covered by e2e tests, so treat it as working, but it depends on router internals that the guide does not promise.

## Not covered or thin

- Astro 7 release post gives no Node, Fonts, CSP or ClientRouter detail [22]; the changelog page did not load, so 7.1 to 7.4 changes are unreviewed.
- The directives page does not list prop serialization rules for islands; not looked up further.
- The Astro React page names `oxc-transform-react` for the compiler; I could not cross-check that package name elsewhere.

## Sources (all fetched 2026-11-02)

1. https://docs.astro.build/en/guides/upgrade-to/v7/ (Astro 7)
2. https://docs.astro.build/en/guides/markdown-content/ (Astro 7; Sätteri added as processor in 6.4.0)
3. https://docs.astro.build/en/guides/integrations-guide/mdx/ (@astrojs/mdx 8.1.2)
4. https://docs.astro.build/en/guides/upgrade-to/v7/ (astro:transitions internals removal section)
5. https://docs.astro.build/en/guides/upgrade-to/v6/ (Astro 6; page truncated after 100k chars)
6. https://docs.astro.build/en/guides/view-transitions/ (ClientRouter, Astro 7 docs)
7. https://docs.astro.build/en/guides/upgrade-to/v5/ (Astro 5)
8. https://docs.astro.build/en/guides/content-collections/ (Astro 7)
9. https://docs.astro.build/en/guides/fonts/ (Astro 7; stable since 6 per [5])
10. https://react.dev/blog/2024/12/05/react-19 (React 19.0)
11. https://react.dev/blog/2024/04/25/react-19-upgrade-guide (React 19.0)
12. https://react.dev/blog/2025/10/01/react-19-2 (React 19.2: Activity, useEffectEvent, hooks lint v6)
13. https://react.dev/learn/you-might-not-need-an-effect (current)
14. https://react.dev/blog/2025/10/07/react-compiler-1 (Compiler 1.0)
15. https://react.dev/reference/eslint-plugin-react-hooks (labelled rc; no flat key names, I took those from the installed 7.1.1 package)
16. https://docs.astro.build/en/guides/integrations-guide/react/ (@astrojs/react 7.1.2)
17. https://react.dev/learn/react-compiler/installation (Vite setup)
18. https://docs.astro.build/en/reference/directives-reference/ (Astro 7)
19. https://docs.astro.build/en/concepts/islands/ (Astro 7)
20. https://docs.astro.build/en/guides/actions/ (4.15+, 5.0 notes)
21. https://react.dev/blog/2026/09/09/react-19-3 (React 19.3)
22. https://astro.build/blog/astro-7/ (Astro 7.0, released 2026-06-22)
23. https://docs.astro.build/en/guides/prefetch/ (ClientRouter turns on `prefetchAll` by default; the repo's `warm-pages.ts:43` already distinguishes the router's fetch from Astro's prefetch)
24. https://react.dev/blog (index of 2025 and 2026 posts)
