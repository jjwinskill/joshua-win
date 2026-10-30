# Local development

How to run, check and test the site locally. Read [`pnpm.md`](pnpm.md) first. Checked against Astro 7.4.4, Vitest 5.0.5, ESLint 10.13.0, Prettier 3.9.10, Wrangler 4.155.0 and Playwright 1.64.1 on 2026-10-29. Later phase 1 tickets extend this file: drafts (#9).

## The stack, briefly

- **Astro 7**, static output, with React for every component. Astro renders `.astro` pages and React components to plain HTML at build time. A React component ships JavaScript only when a page opts in with a `client:*` directive, and the hello page has none.
- The site lives under **`base: '/skill'`** with trailing slashes always on. Never hard-code a leading `/` in a link; use `sitePath()` from `src/lib/paths.ts` (or `import.meta.env.BASE_URL`), or the link escapes `/skill/`.
- There's **no Cloudflare adapter**. A hand-written Worker (`worker/`) sits in front of the built files. Wrangler (`wrangler.jsonc`) serves `dist/` as static assets under `/skill/` (`assets.base_path`) and runs the Worker first on every request (`run_worker_first`), so it can add `X-Robots-Tag: noindex` to every response and 301 anything outside `/skill/` (the bare domain, `www`, stray root paths) into it.
- The Worker's decisions live in `worker/route.ts` (redirects: a pure function from a URL to an outcome) and `worker/gate.ts` (the invite gate). Neither uses Workers APIs. `worker/handler.ts` applies the outcomes, adds the header and turns failures into a 500, and takes the assets binding as a parameter. Both are unit-tested in plain Vitest, and `worker/index.ts` just wires the handler to `env.ASSETS`. Public hosts are https-only (the Worker upgrades http); `localhost`, `127.0.0.1` and `[::1]` stay on http. (`@cloudflare/vitest-pool-workers` supports only Vitest 4, so tests don't run inside workerd.)

## The invite gate

Until publishing, only invite-link holders can see the site (G4). `astro dev` has no Worker, so it isn't gated; try the gate through `wrangler dev`.

- **The link:** any `/skill/` URL with `?invite=<secret>`, such as `https://joshua.win/skill/?invite=<secret>`. A match sets a one-year cookie and redirects to the same URL without the parameter. The bare domain drops its query when it redirects, so a link must include `/skill/`.
- **Without a valid cookie:** every `/skill/` path, assets included, is the placeholder page (`src/pages/placeholder.astro`), a plain 200. It must stay self-contained: anything it loaded from `_astro/` would be gated too.
- **The cookie** holds an HMAC of the secret, never the secret, so it's valid only for the current secret.
- **Fails closed:** only `GATE: "off"` opens it (previews set that in #7). With the gate on and no secret, everyone gets the placeholder, and `wrangler deploy` refuses to run until the secret exists (`secrets.required`).
- **Rotate the secret, which locks everyone out at once:** every cookie and the old link stop working. Josh runs this, which sets a new random secret, deploys immediately and prints the new link to send out. Use a long random value like this one, not a memorable phrase: a member holds a token that a weak secret could be guessed from offline, and hex needs no URL escaping (a `+` or `&` would break the link).

  ```bash
  SECRET=$(openssl rand -hex 32); echo "$SECRET" | pnpm exec wrangler secret put INVITE_SECRET; echo "https://joshua.win/skill/?invite=$SECRET"
  ```

- **Sharing the link:** the link is the key, so treat it like one. Chat apps that preview links (Slack, iMessage) send it to their servers, and a preview bot can read the page. Send it some way that doesn't unfurl, or turn the preview off.

- **Try it locally:** copy `.dev.vars.example` to `.dev.vars` (git-ignored), then `pnpm build && pnpm exec wrangler dev`, and open http://localhost:8787/skill/ and http://localhost:8787/skill/?invite=local-test-secret. Without a `.dev.vars`, you only ever see the placeholder.
- **Tests never use a real secret.** `playwright.config.ts` generates a throwaway secret on every run, locally and in CI, and it overrides any `.dev.vars`.

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Installs dependencies and the pinned Node 26 |
| `pnpm dev` | Dev server with hot reload at http://localhost:4321/skill/ |
| `pnpm build` | Static build into `dist/` |
| `pnpm preview` | Serves `dist/` with Astro's server (no Worker; for a quick look only) |
| `pnpm exec wrangler dev` | Serves `dist/` through the real Worker in local workerd at http://localhost:8787/skill/. Build first. You'll see only the placeholder until you set up `.dev.vars` (see The invite gate). |
| `pnpm typecheck` | `wrangler types` (regenerates the git-ignored `worker-configuration.d.ts`), then `astro check` for the site, then `tsc -p worker` for the Worker (Workers types, not DOM) |
| `pnpm lint` | ESLint (typescript-eslint, the Astro plugin, jsx-a11y) |
| `pnpm format` / `pnpm format:check` | Prettier, writing or checking. Markdown and `docs/` are excluded, so prose is never reflowed. |
| `pnpm test` / `pnpm test:watch` | Vitest: unit and component tests |
| `pnpm test:e2e` | Playwright against `dist/` through the Worker (it starts `wrangler dev` itself). Run `pnpm build` first. The first time, install the browser: `pnpm exec playwright install --only-shell chromium`. |

CI (`.github/workflows/ci.yml`) runs typecheck, lint and format check, then the tests, then the build, then Playwright against that build, each job only if the one before it passed. Run the same commands locally before opening a PR.

## Folders

| Folder | Holds |
|---|---|
| `src/pages/` | Routes. `index.astro` is `/skill/`; `placeholder.astro` is what the gate serves. |
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
- **Worker unit tests** are `worker/**/*.test.ts`: the routing (`route.test.ts`), the gate (`gate.test.ts`), and the handler with a stand-in assets binding (`handler.test.ts`).
- **Integration tests** are `tests/e2e/*.spec.ts` (Playwright). `gate.spec.ts` tests the gate from a reader's side. Other specs test what lies past it, so they take a valid cookie with `test.use({ extraHTTPHeaders: { Cookie: await memberCookie() } })`, from `tests/e2e/invite.ts`. Assert "not the placeholder" through `[data-page="placeholder"]`, not its copy, which Josh will change. They test through HTTP what a reader or a crawler gets: status, headers, redirects and the rendered page. `baseURL` ends in `/skill/`, so navigate with relative paths (`page.goto('./')`, `request.get('essays/')`). For root paths, build an absolute URL: `new URL('/', baseURL)`. To reach the `www` branch locally, send a `Host: www.joshua.win` header.
