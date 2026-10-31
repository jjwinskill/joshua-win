# Local development

How to run, check and test the site locally. Read [`pnpm.md`](pnpm.md) first. Checked against @axe-core/playwright 4.14.0, @lhci/cli 0.15.1, Astro 7.4.4, Vitest 5.0.5, ESLint 10.13.0, Prettier 3.9.10, Wrangler 4.155.0 and Playwright 1.64.1 on 2026-10-29. Drafts have their own doc: [`drafts.md`](drafts.md).

## The stack, briefly

- **Astro 7**, static output, with React for every component. Astro renders `.astro` pages and React components to plain HTML at build time. A React component ships JavaScript only when a page opts in with a `client:*` directive, and the hello page has none.
- The site lives under **`base: '/skill'`** with trailing slashes always on. Never hard-code a leading `/` in a link; use `sitePath()` from `src/lib/paths.ts` (or `import.meta.env.BASE_URL`), or the link escapes `/skill/`.
- There's **no Cloudflare adapter**. A hand-written Worker (`worker/`) sits in front of the built files. Wrangler (`wrangler.jsonc`) serves `dist/` as static assets, and Astro builds into `dist/skill/`, so the files are under `/skill/`. It runs the Worker first on every request (`run_worker_first`), so it can add `X-Robots-Tag: noindex` to every response and 301 anything outside `/skill/` (the bare domain, `www`, stray root paths) into it.
- The Worker's decisions live in `worker/route.ts` (redirects: a pure function from a URL to an outcome), which uses no Workers APIs. `worker/handler.ts` applies the outcomes, adds the header and turns failures into a 500, and takes the assets binding as a parameter. Both are unit-tested in plain Vitest, and `worker/index.ts` just wires the handler to `env.ASSETS`. Public hosts are https-only (the Worker upgrades http); `localhost`, `127.0.0.1` and `[::1]` stay on http. (`@cloudflare/vitest-pool-workers` supports only Vitest 4, so tests don't run inside workerd.)

## Deploying

A merge to `main` deploys: CI runs every check, runs `wrangler deploy` on the build those checks tested, then smoke-tests the live site. Nothing else deploys, except a rollback (see Rolling back) and the local soft-launch deploy in phase 6 (G22).

- **The site is public** (G24). Anyone who visits joshua.win reads what's deployed, and noindex keeps it out of search.
- **What CI needs:** the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets on the `production` GitHub environment, which only `main` can deploy to, so a PR branch can't reach them; and the `CF_ANALYTICS_TOKEN` repository variable. The build fails on `main` if the variable is unset.
- **The token** starts from Cloudflare's "Edit Cloudflare Workers" template, scoped to this account and the `joshua.win` zone. The docs don't say what custom domains need: if the deploy gets an auth error, add `Zone: DNS: Edit` and rerun the job.
- **A failed deploy can still change the site.** Wrangler puts the new version live before it updates the custom domains, so a red deploy job doesn't mean the old version is still up.
- **The first deploy** is the first merge, and it creates the Worker. Set up everything under "What CI needs" first, with the environment limited to `main`, or the build fails or the secrets are missing. Cloudflare's DNS records for `joshua.win` and `www` must be empty, because a CI deploy overwrites them without asking. Smoke-test retries are immediate, so a new certificate can fail that job: rerun it a few minutes later.
- **Zone settings to leave alone:** **Always Use HTTPS** and **Bot Fight Mode** stay off. The Worker already upgrades http, and the edge's redirect wouldn't carry noindex. A bot challenge would fail the smoke tests. Web Analytics must be set to the manual JS snippet (G18).
- **A custom 404 page** will need `not_found_handling: "404-page"` under `assets` in `wrangler.jsonc`. Until then, a missing page is an empty 404.
- **Not deployed on purpose:** there's no zone rule backing up noindex: it would sit outside this repo and keep noindexing after publishing. So errors the platform itself returns (limits, crashes) carry no noindex; they hold no content.
- **Debugging:** Workers Logs are on (`wrangler.jsonc`), or use `wrangler tail`.

## Previews

Previews are on demand from Josh's machine, signed in with `wrangler login` (G26). CI has no preview credential on purpose: a token PR branches can reach could also overwrite production. Checked against the [Worker Previews docs](https://developers.cloudflare.com/workers/previews/) (updated 2026-09-24) and Wrangler 4.155.0, whose help calls the command an open beta.

```bash
pnpm build && pnpm exec wrangler preview --name my-test
```

It prints a URL, which always shows that name's latest upload. Anyone with the URL can read it, and it carries noindex from the Worker, as well as Cloudflare's own on `workers.dev`. It doesn't affect production, and it serves whatever is in your local `dist/`. Delete it when you're done; past the plan's limit, Cloudflare deletes the least recently used:

```bash
pnpm exec wrangler preview delete --name my-test --skip-confirmation
```

Don't run these in CI or paste `--json` output anywhere public: when tested, it included the account's email.

## Rolling back

Tested end to end on 2026-10-30 (#18, #19), against Cloudflare's [rollback docs](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/) (updated 2026-07-15). If a deploy breaks the live site, do both steps, in this order. Josh runs them. **Merge nothing else until the revert lands:** any merge to `main` redeploys the bad code over the rollback.

1. **Fix the live site on Cloudflare.** In the dashboard, go to **Workers & Pages**, select `joshua-win`, then **Deployments**. Open the three-dot menu on the last good version and select **Rollback**. The site changed by the time Josh reloaded, and the old version of the page came back, which Cloudflare's docs don't mention. This doesn't touch GitHub, so a failing check can't block it. Cloudflare can refuse a rollback if a binding the old version uses was deleted, or after certain Durable Object changes; this site has neither today. `pnpm exec wrangler rollback` should do the same, but wasn't tested.
2. **Fix `main` on GitHub, or the next merge brings the bad code back.** On the merged PR, select **Revert**, then **Create pull request**. When the four checks pass, squash-merge and delete the branch. The merge deploys a new version over the rollback. A PR containing only GitHub's revert skips the independent review (G25).

If a revert can't pass its checks, the site stays safe on the rolled-back version. Fix forward in a new PR. Turning off the rule on `main` is Josh's call and a last resort: turn it back on straight away, and review what went in without it.

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Installs dependencies and the pinned Node 26 |
| `pnpm dev` | Dev server with hot reload at http://localhost:4321/skill/. **When an agent runs it, Astro 7 detaches it into the background:** stop it with `pnpm exec astro dev stop`, because killing the process you started won't. `--ignore-lock` keeps it in the foreground. `astro preview` detaches too. |
| `pnpm build` | Static build into `dist/skill/` |
| `pnpm preview` | Serves `dist/skill/` with Astro's server (no Worker; for a quick look only) |
| `pnpm exec wrangler dev` | Serves `dist/` through the real Worker in local workerd at http://localhost:8787/skill/. Build first. |
| `pnpm typecheck` | `wrangler types` (regenerates the git-ignored `worker-configuration.d.ts`), then `astro check` for the site, then `tsc -p worker` for the Worker (Workers types, not DOM) |
| `pnpm lint` | ESLint (typescript-eslint, the Astro plugin, jsx-a11y) |
| `pnpm format` / `pnpm format:check` | Prettier, writing or checking. Markdown and `docs/` are excluded, so prose is never reflowed. |
| `pnpm test` / `pnpm test:watch` | Vitest: unit and component tests |
| `pnpm test:lighthouse` | Lighthouse CI on `dist/` through the Worker, on port 8789: three runs on a throttled phone profile, failing if the median LCP is over 2.5 s, CLS over 0.1 or TBT over 200 ms. It measures the home page and the essay page. It finds an installed Chrome. Run `pnpm build` first. Reports go to `lighthouse-reports/`. |
| `pnpm test:smoke` | Playwright against the live https://joshua.win/skill/, as the public gets it (no browser). CI runs it after every deploy. |
| `pnpm test:e2e` | Playwright against `dist/` through the Worker (it starts `wrangler dev` itself, on port 8788, so it can run beside your own `wrangler dev`). Run `pnpm build` first. The first time, install the browser: `pnpm exec playwright install --only-shell chromium`. |

CI (`.github/workflows/ci.yml`) runs typecheck, lint and format check, then the tests, then the build, then Playwright and axe against that build, then Lighthouse, each job only if the one before it passed. Run the same commands locally before opening a PR.

## Folders

| Folder | Holds |
|---|---|
| `src/pages/` | Routes. `index.astro` is `/skill/`. |
| `src/layouts/` | Page shells (`Base.astro`) |
| `src/dev/` | Pages that only exist under `astro dev`, injected from `astro.config.mjs` |
| `src/components/` | The shared React component library. No Astro or framework APIs, so the bake-off can reuse it in Next. |
| `src/lib/` | Plain TypeScript helpers |
| `worker/` | The Worker in front of the static files, with its own `tsconfig.json` |
| `tests/build/` | Tests that run `astro build` on a copy of the site (in `pnpm test`) |
| `tests/e2e/` | Playwright tests against the built site through the Worker |
| `src/content/` | Content that lives with the code (later phases). Collections are configured in `src/content.config.ts`. The old `src/content/config.ts` path is removed in Astro 7: the build fails with `LegacyContentConfigError`. |
| `content/lorem/` | Lorem pieces, free to edit |

## Tests

- **Unit tests** are `src/**/*.test.ts` and run in Node. The example is `src/lib/paths.test.ts`.
- **Component tests** are `src/**/*.test.tsx` and run in jsdom with Testing Library and the jest-dom matchers. The example is `src/components/Greeting.test.tsx`. Test what a reader sees (roles, text), not internals. `.astro` files aren't component-tested, because Astro's Container API is still experimental (`experimental_AstroContainer` in Astro 7.4.4); Playwright covers them through the built site.
- Under Vitest, `import.meta.env.BASE_URL` is `/`, not `/skill/`, so pass the base explicitly in unit tests.
- **Worker unit tests** are `worker/**/*.test.ts`: the routing (`route.test.ts`) and the handler with a stand-in assets binding (`handler.test.ts`).
- **Integration tests** are `tests/e2e/*.spec.ts` (Playwright). They test through HTTP what a reader or a crawler gets: status, headers, redirects and the rendered page. `baseURL` ends in `/skill/`, so navigate with relative paths (`page.goto('./')`, `request.get('essays/')`). For root paths, build an absolute URL: `new URL('/', baseURL)`. `wrangler dev` sets the host the Worker sees (`dev.host` in `wrangler.jsonc`), so `www` can't be reached locally: `route.test.ts` covers its logic, and the smoke test covers the live host. `routes.spec.ts` finds every HTML page in the build and checks each for noindex and axe violations, so a new page needs no new test.
