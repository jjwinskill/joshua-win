# Stack traps

Where this repo's versions differ from what a model's training data suggests. Read this before writing code here, and trust it over what you remember. Checked 2026-11-02 against the installed packages and the sources in [`docs/research/agent-practices/`](../research/agent-practices/). pnpm has its own doc: [`pnpm.md`](pnpm.md).

## Astro 7.4 and MDX

| An older habit | Now |
|---|---|
| `markdown.remarkPlugins`, `mdx({ remarkPlugins })` | Sätteri is the default processor: `mdx({ processor: satteri({ mdastPlugins, hastPlugins }) })` |
| Sloppy HTML in `.astro` | The Rust compiler errors on unclosed tags, and no longer repairs bad nesting |
| A newline between inline elements makes a space | `compressHTML` defaults to `'jsx'`, so write `{" "}` |
| `ViewTransitions`, `TRANSITION_*`, `isTransitionBeforeSwapEvent` | `ClientRouter` and event-name strings such as `'astro:after-swap'` |
| `DOMContentLoaded`, or a bundled script rerunning per page | Bundled scripts run once. Per-page setup goes in `astro:page-load` |
| `z` from `astro:content` or `zod`, `z.string().email()`, `{ message }` | `z` from `astro/zod` (Zod 4): `z.email()`, `{ error }`, `.prefault()` |
| `src/content/config.ts`, `type: 'content'`, `entry.slug`, `entry.render()`, `Astro.glob()` | `src/content.config.ts`, `glob()` from `astro/loaders`, `entry.id`, `render(entry)`, `import.meta.glob` |
| `react({ babel })`, `babel-plugin-react-compiler` | `@astrojs/react` 7 has no `babel` option. The Compiler is `react({ compiler: true })` with `oxc-transform-react`, and this site doesn't use it |
| Astro Actions for a form | They need on-demand rendering, and this site has no adapter |

`.astro` types come from `astro sync`. The Fonts API (`fontProviders`, `<Font />`) is stable, though piece 3's hand-written `@font-face` is fine for a one-off.

## React 19.3

| An older habit | Now |
|---|---|
| `forwardRef`, `<Context.Provider>`, `defaultProps`, `propTypes`, `useRef()` with no argument, global `JSX` | `ref` is a prop, `<Context value>`, destructuring defaults, `useRef(undefined)`, `React.JSX` |
| `useEffect` for derived state, resets or events | Compute in render, reset with `key`, use handlers. Effects only sync with outside systems, and clean up |
| Silencing `exhaustive-deps` | `useEffectEvent` (19.2), for event logic inside an Effect |
| Only two hooks lint rules | The flat recommended preset adds `set-state-in-effect`, `refs`, `purity`, `immutability` and more, all errors here |
| A `<title>` from an island | The head belongs to `Base.astro`, because `ClientRouter` swaps it |

`<ViewTransition>` (19.3) only animates React's own Transition updates. This site's transitions are Astro's.

## Tests

| An older habit | Now |
|---|---|
| `playwright test --only-changed` picks what a site change affects | It follows a spec's own imports, and these specs import nothing from `src/`, so it selects nothing and exits 0. Use `pnpm check:selected` |
| Vitest `--changed` covers it | It misses `tests/build/`, and bare `--changed` compares only uncommitted work. The whole suite is about 23 s, so run it all |
| `retries` as a safety net | A flaky pass exits 0. `failOnFlakyTests` turns it into a failure, which here is on at checkpoints only |
| Vitest 3 or 4 behavior | In Vitest 5, `clearMocks` defaults to true, and an unawaited `resolves` or `rejects` fails the test |
| `page.clock` controls animation | It fakes timers and `requestAnimationFrame`, and CSS animations keep running |

## Platform

| An older habit | Now |
|---|---|
| Scroll-driven animation is Chrome-only | Chrome 115, Safari 26, Firefox 159. Keep the `@supports` gate for older phones |
| A router reports one set of vitals | Chrome 151 measures soft navigations, which include `ClientRouter`. Lighthouse here is 12.6.1 and the current one is 13 |
| `_headers` applies everywhere | Not to a response from the Worker, so headers are set there. `run_worker_first` bills each asset and turns off Speed Brain; revisit it when noindex goes at launch |
| A skipped required check passes | A workflow skipped by a path filter leaves it pending, and a job skipped by `if:` reports success. Keep `Checks` free of both on PRs |
| `gh pr merge --auto` always queues | On an already clean PR it merges at once, so arm it last |
