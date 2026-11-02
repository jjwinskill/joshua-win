# Local development

How to run, check and test the site locally. Read [`pnpm.md`](pnpm.md) first. Checked against @axe-core/playwright 4.14.0, @lhci/cli 0.15.1, Astro 7.4.4, Vitest 5.0.5, ESLint 10.13.0, Prettier 3.9.10, Wrangler 4.155.0 and Playwright 1.64.1 on 2026-10-29. Drafts have their own doc: [`drafts.md`](drafts.md).

## The stack, briefly

- **Astro 7**, static output, with React for every component. Astro renders `.astro` pages and React components to plain HTML at build time. A React component ships JavaScript only when a page opts in with a `client:*` directive, and most pages have none.
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

## Merging a PR

A merge to `main` deploys, so it waits for Josh's OK and an independent review.

```bash
gh pr merge <number> --repo jjwinskill/joshua-win --squash --match-head-commit <sha> --author-email jjwinskill@github.com
```

- **The author email:** GitHub accepts only addresses it lists for the account, and it refuses the private noreply address that local commits use. `jjwinskill@github.com` is the one to use. The account's other address is an old work email, which must stay out of history.
- **Merge a batch together (G38):** PRs that are ready and approved merge one after another, without waiting for each other's deploys. `main` runs one workflow at a time and keeps one pending, so runs queued in between may be cancelled, and the latest one tests and deploys everything merged. A run reads "cancelled" for this reason, and that's fine as long as a later run passes.
- **Wait for the result:** `gh run watch <id> --exit-status` on the latest `main` run. Clean up only once **Deploy to production** and **Smoke test production** pass, because a failed run may still need the preview and the branch. A merge of docs alone starts no run and deploys nothing, so it won't repair a failed run: production stays behind `main` until a site change merges, or you re-run the failed run. Re-run it only if it's the newest run on `main`, because an older one deploys its older build over newer code.
- **Check the live site with `curl -L`:** pages redirect to a trailing slash, so a plain `curl` reads an empty 307.
- **Clean up:** delete any preview for the PR. GitHub deletes the PR's branch on merge, and local worktrees and branches are yours to remove.

## Rolling back

Tested end to end on 2026-10-30 (#18, #19), against Cloudflare's [rollback docs](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/) (updated 2026-07-15). If a deploy breaks the live site, do both steps, in this order. Josh runs them. **Merge nothing else until the revert lands, and cancel any `main` run that's running or pending first:** any of them redeploys the bad code over the rollback.

1. **Fix the live site on Cloudflare.** In the dashboard, go to **Workers & Pages**, select `joshua-win`, then **Deployments**. Open the three-dot menu on the last good version and select **Rollback**. The site changed by the time Josh reloaded, and the old version of the page came back, which Cloudflare's docs don't mention. This doesn't touch GitHub, so a failing check can't block it. Cloudflare can refuse a rollback if a binding the old version uses was deleted, or after certain Durable Object changes; this site has neither today. `pnpm exec wrangler rollback` should do the same, but wasn't tested.
2. **Fix `main` on GitHub, or the next merge brings the bad code back.** On the merged PR, select **Revert**, then **Create pull request**. When the required check passes, squash-merge with the author email from Merging a PR. GitHub deletes the branch. The merge deploys a new version over the rollback. A PR containing only GitHub's revert skips the independent review (G25).

If a revert can't pass its checks, the site stays safe on the rolled-back version. Fix forward in a new PR. Turning off the rule on `main` is Josh's call and a last resort: turn it back on straight away, and review what went in without it.

## Checking motion

Check a transition or animation in this order, so it costs as few images as possible. Checked with ffmpeg 7.1 and qrcode 1.5.4 on 2026-10-31. Run these from your scratchpad or another folder outside the repo, so a recording or a QR code for a preview never gets committed.

1. **Assert it in a test** where a fact can be read off the page. `recordMidTransition` in `tests/e2e/home.spec.ts` shows how: it reads the running animations and the parade's position as a transition starts, so a missing animation fails CI. It can't judge the look.
2. **Read a contact sheet from the iOS Simulator**, not a frame per image. Start the recording and wait for `Recording started`, trigger the motion, then stop it with `SIGINT`. Tile the frames that changed:

   ```bash
   xcrun simctl io booted recordVideo --codec=h264 --force motion.mp4
   ```

   ```bash
   ffmpeg -v error -y -i motion.mp4 -vf "select='gt(scene,0.003)',scale=150:-1,tile=12x3" -fps_mode vfr motion-%d.jpg
   ```

   Each sheet holds 36 frames. Read every sheet it writes, because the motion's end is in the last one. If there are too many, raise the `scene` number. Enlarge single frames only when a sheet leaves a question.
3. **Send it to Josh's phone.** He signs off on how motion feels. The throttled checks reported no layout shift for a jump he could see on his phone, and the Simulator can't run Chrome on iOS. Upload a preview (see Previews), then make a QR code for its URL. `</dev/null` stops the command waiting on input.

   ```bash
   pnpm dlx qrcode@1.5.4 -o qr.png -w 400 <preview-url> </dev/null
   ```

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Installs dependencies and the pinned Node 26 |
| `pnpm dev` | Dev server with hot reload at http://localhost:4321/skill/. **When an agent runs it, Astro 7 detaches it into the background:** stop it with `pnpm exec astro dev stop`, because killing the process you started won't. `--ignore-lock` keeps it in the foreground. `astro preview` detaches too. |
| `pnpm dev`, then print `/skill/template-sheet/` | The cast template sheet (P5), which exists only under `astro dev`. Print it from a browser to save a PDF, with headers and footers off. It's one US Letter page. |
| `pnpm build` | Static build into `dist/skill/` |
| `pnpm charts` | Renders the Mermaid floor from the run file into `src/components/charts/mermaid/`, using Playwright's Chromium (G40). Run it after changing `src/content/run.json` or how charts are generated, and commit the SVGs. Unit tests fail until you do. Checked against Mermaid 12.2.0 on 2026-11-01. |
| `pnpm preview` | Serves `dist/skill/` with Astro's server (no Worker; for a quick look only) |
| `pnpm exec wrangler dev` | Serves `dist/` through the real Worker in local workerd at http://localhost:8787/skill/. Build first. |
| `pnpm typecheck` | `wrangler types` (regenerates the git-ignored `worker-configuration.d.ts`), then `astro check` for the site, then `tsc -p worker` for the Worker (Workers types, not DOM) |
| `pnpm lint` | ESLint (typescript-eslint, the Astro plugin, jsx-a11y, React hooks and leak rules), failing on any warning |
| `pnpm format` / `pnpm format:check` | Prettier, writing or checking. Markdown and `docs/` are excluded, so prose is never reflowed. |
| `pnpm test` / `pnpm test:watch` | Vitest: unit and component tests |
| `pnpm test:lighthouse` | Lighthouse CI on `dist/` through the Worker, on port 8789: one run of the heavy page on a throttled phone profile, failing if LCP is over 2.5 s, CLS over 0.1 or TBT over 200 ms. `pnpm test:lighthouse:full` runs the home, essay, contents and heavy pages and pieces 2 and 3 three times each, and judges the median. It finds an installed Chrome. Run `pnpm build` first. Reports go to `lighthouse-reports/`. |
| `pnpm test:perf` | Throttled checks in headless Chromium at a phone viewport with 4x CPU throttling (`tests/perf/`): a touch scroll, a tap on a parade dot, the card transition from a cold and a warm navigation, and on the heavy page the running scene and scrubbing the chart. CLS over 0.1 or INP over 200 ms fails; frame timing is reported only. Build first. Results append to `perf-results/results.jsonl`, and a checkpoint keeps that file. To measure a deployed site, set `PERF_BASE_URL` to its URL ending in `/skill/`. A page's own limit goes in `tests/perf/limits.ts`, with Josh's OK and a reason. Headless Chromium draws WebGL in software, so frame rates don't tell you about a phone. |
| `pnpm test:smoke` | Playwright against the live https://joshua.win/skill/, as the public gets it (no browser). CI runs it after every deploy. |
| `pnpm test:e2e` | Playwright against `dist/` through the Worker (it starts `wrangler dev` itself, on port 8788, so it can run beside your own `wrangler dev`). Run `pnpm build` first. The first time, install the browser: `pnpm exec playwright install --only-shell chromium`. |

CI (`.github/workflows/ci.yml`) runs one job, **Checks**, on every PR and before every deploy: typecheck, lint and format check, the tests, the build, Playwright and axe against that build, then one Lighthouse run. It should take about two minutes, so keep it there. A merge of only `docs/` or Markdown at the repo root starts no run and deploys nothing.

## Testing cadence (G38)

| When | What runs |
|---|---|
| Before pushing | `pnpm typecheck`, `pnpm lint`, `pnpm test`, and the Playwright specs for what changed |
| Every PR, and before every deploy | **Checks**, in CI |
| Each phase's end, and a risky PR | A **checkpoint**, on top of Checks: `gh workflow run checkpoint.yml --ref <branch>` |
| Anything that moves | Josh's phone, through a preview |

A checkpoint runs `pnpm test:perf` and `pnpm test:lighthouse:full`, and keeps their results for 30 days. A risky PR is one that touches the transition, the Worker, CI or the deploy, or upgrades Astro, React or Wrangler. Link its checkpoint in the PR before asking Josh to merge. Nothing enforces this, so the agent opening the PR is responsible for it.

## Folders

| Folder | Holds |
|---|---|
| `src/pages/` | Routes. `index.astro` is `/skill/`. |
| `src/layouts/` | Page shells (`Base.astro`) |
| `src/dev/` | Pages that only exist under `astro dev`, injected from `astro.config.mjs` |
| `src/styles/` | The site's plain CSS, until phase 4 chooses the house style |
| `src/components/` | The shared React component library, free of Astro and framework APIs |
| `src/lib/` | Plain TypeScript helpers |
| `worker/` | The Worker in front of the static files, with its own `tsconfig.json` |
| `tests/build/` | Tests that run `astro build` on a copy of the site (in `pnpm test`) |
| `tests/e2e/` | Playwright tests against the built site through the Worker |
| `tests/perf/` | Throttled scrolling, interaction and transition checks |
| `scripts/` | Tools run by hand, such as `pnpm charts` |
| `src/content/` | Content that lives with the code, such as the run file (`run.json`). Collections are configured in `src/content.config.ts`. The old `src/content/config.ts` path is removed in Astro 7: the build fails with `LegacyContentConfigError`. |
| `content/lorem/` | Lorem pieces, free to edit, in Markdown or MDX, with their one-off components in `one-offs/` |

## Tests

- **Unit tests** are `src/**/*.test.ts` and run in Node. The example is `src/lib/paths.test.ts`.
- **Component tests** are `src/**/*.test.tsx` and run in jsdom with Testing Library and the jest-dom matchers. The example is `src/components/cast/CastList.test.tsx`. Test what a reader sees (roles, text), not internals. `.astro` files aren't component-tested, because Astro's Container API is still experimental (`experimental_AstroContainer` in Astro 7.4.4); Playwright covers them through the built site.
- Under Vitest, `import.meta.env.BASE_URL` is `/`, not `/skill/`, so pass the base explicitly in unit tests.
- **Worker unit tests** are `worker/**/*.test.ts`: the routing (`route.test.ts`) and the handler with a stand-in assets binding (`handler.test.ts`).
- **Integration tests** are `tests/e2e/*.spec.ts` (Playwright). They test through HTTP what a reader or a crawler gets: status, headers, redirects and the rendered page. `baseURL` ends in `/skill/`, so navigate with relative paths (`page.goto('./')`, `request.get('essays/')`). For root paths, build an absolute URL: `new URL('/', baseURL)`. `wrangler dev` sets the host the Worker sees (`dev.host` in `wrangler.jsonc`), so `www` can't be reached locally: `route.test.ts` covers its logic, and the smoke test covers the live host. `routes.spec.ts` finds every HTML page in the build and checks each for noindex and axe violations, so a new page needs no new test.
