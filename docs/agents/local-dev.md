# Local development

How to run, check and test the site locally. Read [`pnpm.md`](pnpm.md) first. Checked against Astro 7.4.4, Vitest 5.0.5, ESLint 10.13.0, Prettier 3.9.10, Wrangler 4.155.0 and Playwright 1.64.1 on 2026-10-29. Later phase 1 tickets extend this file: the invite gate's test secret and rotation (#4), and drafts (#9).

## The stack, briefly

- **Astro 7**, static output, with React for every component. Astro renders `.astro` pages and React components to plain HTML at build time. A React component ships JavaScript only when a page opts in with a `client:*` directive, and the hello page has none.
- The site lives under **`base: '/skill'`** with trailing slashes always on. Never hard-code a leading `/` in a link; use `sitePath()` from `src/lib/paths.ts` (or `import.meta.env.BASE_URL`), or the link escapes `/skill/`.
- There's **no Cloudflare adapter**. A hand-written Worker (`worker/`) sits in front of the built files. Wrangler (`wrangler.jsonc`) serves `dist/` as static assets under `/skill/` (`assets.base_path`) and runs the Worker first on every request (`run_worker_first`), so it can add `X-Robots-Tag: noindex` to every response and 301 anything outside `/skill/` (the bare domain, `www`, stray root paths) into it.
- The Worker's decisions live in `worker/route.ts`, a pure function from a URL to an outcome with no Workers APIs, so it's unit-tested in plain Vitest. `worker/index.ts` is the thin fetch handler that applies the outcome and adds the header. (`@cloudflare/vitest-pool-workers` supports only Vitest 4, so tests don't run inside workerd.)

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Installs dependencies and the pinned Node 26 |
| `pnpm dev` | Dev server with hot reload at http://localhost:4321/skill/ |
| `pnpm build` | Static build into `dist/` |
| `pnpm preview` | Serves `dist/` with Astro's server (no Worker; for a quick look only) |
| `pnpm exec wrangler dev` | Serves `dist/` through the real Worker in local workerd at http://localhost:8787/skill/. Build first. |
| `pnpm typecheck` | `wrangler types` (regenerates the git-ignored `worker-configuration.d.ts`), then `astro check` for the site, then `tsc -p worker` for the Worker (Workers types, not DOM) |
| `pnpm lint` | ESLint (typescript-eslint, the Astro plugin, jsx-a11y) |
| `pnpm format` / `pnpm format:check` | Prettier, writing or checking. Markdown and `docs/` are excluded, so prose is never reflowed. |
| `pnpm test` / `pnpm test:watch` | Vitest: unit and component tests |
| `pnpm test:e2e` | Playwright against `dist/` through the Worker (it starts `wrangler dev` itself). Run `pnpm build` first. The first time, install the browser: `pnpm exec playwright install --only-shell chromium`. |

CI (`.github/workflows/ci.yml`) runs typecheck, lint and format check, then the tests, then the build, then Playwright against that build, each job only if the one before it passed. Run the same commands locally before opening a PR.

## Folders

| Folder | Holds |
|---|---|
| `src/pages/` | Routes. `index.astro` is `/skill/`. |
| `src/layouts/` | Page shells (`Base.astro`) |
| `src/components/` | The shared React component library. No Astro or framework APIs, so the bake-off can reuse it in Next. |
| `src/lib/` | Plain TypeScript helpers |
| `worker/` | The Worker in front of the static files, with its own `tsconfig.json` |
| `tests/e2e/` | Playwright tests against the built site through the Worker |
| `src/content/` | Content that lives with the code (later phases). Collections are configured in `src/content.config.ts`. The old `src/content/config.ts` path is removed in Astro 7: the build fails with `LegacyContentConfigError`. |
| `content/lorem/` | Lorem pieces, free to edit |

## Tests

- **Unit tests** are `src/**/*.test.ts` and run in Node. The example is `src/lib/paths.test.ts`.
- **Component tests** are `src/**/*.test.tsx` and run in jsdom with Testing Library and the jest-dom matchers. The example is `src/components/Greeting.test.tsx`. Test what a reader sees (roles, text), not internals. `.astro` files aren't component-tested, because Astro's Container API is still experimental (`experimental_AstroContainer` in Astro 7.4.4); Playwright covers them through the built site.
- Under Vitest, `import.meta.env.BASE_URL` is `/`, not `/skill/`, so pass the base explicitly in unit tests.
- **Worker unit tests** are `worker/**/*.test.ts`, on the decision function only (`worker/route.test.ts`).
- **Integration tests** are `tests/e2e/*.spec.ts` (Playwright). They test through HTTP what a reader or a crawler gets: status, headers, redirects and the rendered page. `baseURL` ends in `/skill/`, so navigate with relative paths (`page.goto('./')`, `request.get('essays/')`). For root paths, build an absolute URL: `new URL('/', baseURL)`. To reach the `www` branch locally, send a `Host: www.joshua.win` header.
