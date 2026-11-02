# Auto-merge on selected tests: testing, CI and supply chain (checked 2026-11-02)

Repo state read: Vitest 5.0.5, Playwright 1.64.1 (latest tag), pnpm 12.16.1, Node 26.13.0, Wrangler 4.155.0. Facts marked (gh) came from the GitHub API on the repo today. Doc pages were read through a summarizer, so quotes are short and "not stated" means the page did not say.

## 1. Proposal

**Local "selected tests" (what the agent runs before opening the PR)**
- Always: `pnpm typecheck && pnpm lint && pnpm format:check`.
- Vitest: just run all of `pnpm test`. CI shows it takes about 23 s. `--changed` saves little here and misses `tests/build/*` (T5, T6). If you still want selection: `vitest run --changed origin/main` (never bare `--changed` after committing, because it compares only uncommitted work).
- Playwright: always `tests/e2e/routes.spec.ts` and `worker.spec.ts` (the noindex specs), plus the specs a small path map selects (below). Playwright's own `--only-changed` is not usable as the selector (T1 to T3).
- Simplest sound path-to-spec map: one hand-kept table (a ~30-line script, e.g. `scripts/select-e2e.ts`) that reads `git diff --name-only origin/main...HEAD` and prints spec files. Any path it does not recognize (`src/layouts`, `src/styles/site.css`, `astro.config.mjs`, `worker/`, `wrangler.jsonc`, `package.json`, lockfile, `tests/e2e/fail-on-errors.ts`) selects ALL e2e specs. Unknown means everything. Sketch, to validate against the specs before use: `src/components/parade/**`, `parade.css` to parade, home, navigation; `PixelBattle`, `lib/battle.ts`, `battle.css` to battle; `ScrollRobot`, `robot.css` to robot; `UmbrellaCarousel`, `umbrella*` to umbrella; `figures/**`, `lib/run*.ts` to heavy, write-up; `cast/**`, `lib/piece-cast.ts` to essay; `content/lorem/ut-labore.mdx` to piece-3. Every checkpoint runs full e2e; any failure the map would not have selected means fix the map.
- Honest cost note: full e2e was 87 s of a 177 s Checks job (run 41510108085). The map saves roughly one minute locally. It is worth it only if the owner wants it.

**Turning auto-merge on** (the repo has it off: `allow_auto_merge:false` (gh))
1. `gh api -X PATCH repos/jjwinskill/joshua-win -F allow_auto_merge=true` (parameter is documented, default false).
2. Already in place (gh): classic protection on `main`, required check `Checks` (app 15368), `strict:false`, 0 required reviews, `enforce_admins:true`, no rulesets, squash allowed, `delete_branch_on_merge:true`, `production` environment limited to branch `main`. Nothing else is needed.
3. Per PR, as the last step after the independent review and the final push: `gh pr merge <n> --auto --squash --match-head-commit "$(git rev-parse HEAD)"`. No `--delete-branch` needed. If the PR is already clean, gh merges immediately instead of arming (T11).
4. Risky PRs (G38 list: transition, Worker, CI, deploy, Astro/React/Wrangler upgrades) do not get `--auto`; they wait for a checkpoint and Josh.

**Trimmed `Checks` job** (same name, same triggers, no path filter on `pull_request`, no `if:` on the job). Keep every step in ci.yml up to `pnpm test`, unchanged, then replace the rest:
```yaml
      - run: pnpm test                      # full Vitest (~23 s): drafts-leak build test, Worker routing/noindex units
      - run: pnpm exec playwright install --with-deps --only-shell chromium
        timeout-minutes: 5
      # Privacy gate (G24): noindex on every built page and asset kind, axe on every page, Worker redirects.
      - run: pnpm exec playwright test tests/e2e/routes.spec.ts tests/e2e/worker.spec.ts
      # Removed from Checks, moved to checkpoint.yml: the other 11 e2e specs, and `pnpm test:lighthouse`.
```
`checkpoint.yml` gains `- run: pnpm test:e2e` (full e2e) before `pnpm test:perf`; Lighthouse full is already there. Optional extra on PRs: `fetch-depth: 0` on checkout plus `playwright test --only-changed=origin/main` to run any spec the PR itself edited (the only thing `--only-changed` can see here).
Estimated saving: about 90 s of 177 s (the gate specs still cost something; not measured).

**Must stay before deploy, and why.** noindex is the only privacy control (G24), and lorem pieces are live.
- `pnpm build` and the beacon check: main must carry the beacon, non-main must not. The deploy ships the uploaded `dist`, so it is the artifact under test.
- `routes.spec.ts` and `worker.spec.ts`: they discover every built HTML page and check `X-Robots-Tag: noindex` and axe. The main-branch push re-runs them on the exact build that deploys.
- Full Vitest: includes `tests/build/drafts.test.ts` (drafts never reach the public build) and the Worker route/handler tests.
- typecheck (`wrangler types`, `astro check`, `tsc -p worker`), lint, format: 3 to 11 s each.
- Post-deploy `smoke` stays: it checks live noindex, redirects and the beacon. It detects, it cannot prevent, so keep the documented rollback.

**Safe to move to a checkpoint:** behavior e2e specs for parade, battle, robot, umbrella, piece-3, heavy, home, navigation, essay, write-up (none checks privacy); the one-run Lighthouse (a performance budget, G29/G30, not safety); perf.

## 2. Traps (older-model assumption / correct now / source / does repo follow)

| # | Topic | Older model assumes | Correct now | Src | Repo |
|---|---|---|---|---|---|
| T1 | Playwright `--only-changed` reach | It maps changed source to affected e2e tests | Changed files go through a dependency graph built from each test file's own TS/JS imports. E2E specs here import only `@playwright/test` and `./fail-on-errors`, so a change under `src/`, CSS, MDX, `worker/` selects nothing | P1 P2 P3 | Specs test `dist/` over HTTP; not selectable |
| T2 | Bare `--only-changed` | Compares against the last PR/main | Defaults to uncommitted changes vs HEAD. `git diff <ref>` includes the working tree, untracked files count as changed. In `createLoadTask` the "no tests found" error is skipped when `onlyChanged` is set, so a committed change runs 0 tests (read from main, not the 1.64.1 tag; confirm locally) | P1 P3 P4 | Not used |
| T3 | ESM shared imports | The graph is complete | Open bug #43824, seen on 1.63.0 and 1.64.1: when several ESM spec files share a module, only the first-loaded spec is selected. Fix PR #43837 is a draft. `package.json` has `"type":"module"` and 6 specs share `fail-on-errors.ts` | P5 | Affected; map `fail-on-errors.ts` to all |
| T4 | Shallow CI clone | `git diff origin/main` just works | `actions/checkout` fetches depth 1; Playwright throws on an unknown base and points to `fetch-depth: 0`. Vitest's `--changed <ref>` needs Git history too | P4 P6 | ci.yml uses default depth; fine while CI runs fixed set |
| T5 | Vitest `--changed` | Whole-repo diff aware | Runs tests whose static import graph contains a changed file. `vitest related` follows static imports only. Config or `package.json` change forces a full run by default; `setupFiles`/`globalSetup` change reruns that project. `tests/build/*` spawn `astro build`/ESLint and import no `src`, so they are never selected | V1 V2 V3 | Yes, affected |
| T6 | `forceRerunTriggers` | Defaults cover the project | Default is `package.json` and the vitest/vite config only. `astro.config.mjs` (consumed via `getViteConfig`), `pnpm-lock.yaml`, `tsconfig.json`, `wrangler.jsonc` are not triggers | V4 | Not set |
| T7 | `--since-last-run` | Exists in Vitest 5 | The 5.1.0 recipe recommends it for agents, but the installed 5.0.5 `--help` lists only `--changed` and `related` (checked locally). Needs a bump past 5.0.5 | V1 + local | N/A until upgraded |
| T8 | Vitest 5 changes | Vitest 3/4 behavior | Needs Vite >= 6.4.0, Node >= 22.12; `clearMocks` default true; unawaited `resolves`/`rejects` fail the test; `expect.poll` fails on timeout; inline projects inherit root config (`extends` true); reporters write to `.vitest/`; fake timers mock `Temporal`. Release 2026-09-03 | V7 V8 | `extends: true` already explicit; suite passes on 5.0.5 |
| T9 | Repo auto-merge setting | Always available | Must be enabled per repo first; write access can then arm it per PR. Merge-queue branches differ (not used here) | G1 G2 | Off today |
| T10 | Required check skipped | A skipped required check passes | A workflow skipped by path/branch filter or `skip-checks` leaves its checks Pending and blocks merge. A job skipped by `if:` reports Success, so an `if:` on the `Checks` job itself would let anything merge. Don't path-filter required workflows | G3 | `pull_request` has no filter; `push` uses `paths-ignore` (fine, not the required event) |
| T11 | `gh pr merge --auto` | Always queues | `--auto` is ignored when the PR is already clean and it merges at once. `--match-head-commit` is passed as `expectedHeadOid`, documented as only "the expected head OID". Whether it holds after arming is undocumented: test on a throwaway PR | C1 C2 G4 | Proposed |
| T12 | Push after arming | New push disarms | Docs list disarming only for pushes by people WITHOUT write access. Required checks bind to the head SHA, so a later push waits for a fresh `Checks`, but unreviewed code can merge. Arm last | G1 G2 | Process rule |
| T13 | `strict:false` | Green PR means green main | Two individually green PRs can break main together. The push-to-main `Checks` gates the deploy, but main can sit red | G5 | strict false |
| T14 | Retries hide flakes | `retries` is a safety net | Flaky (failed, then passed) is reported and exits 0 unless `failOnFlakyTests` (v1.52). With no human watching, a flake auto-merges | P7 P8 | `retries:1` on CI, no `failOnFlakyTests` |
| T15 | Fixed sleeps | `waitForTimeout` is fine | Docs favor locators with auto-wait and web-first assertions. Page doesn't name `waitForTimeout` | P9 | About 25 `waitForTimeout` calls in `tests/e2e`; some paired with `waitForFunction`. Flake risk |
| T16 | Animation testing | Disable animations globally | `toHaveScreenshot` already defaults `animations:"disabled"`. `page.clock` fakes timers and `requestAnimationFrame`, not CSS animations. `reducedMotion` is a test option since v1.50. I found no official guidance specific to scroll-driven UI | P10 P11 P12 | Uses `test.use({reducedMotion})` and `waitForFunction` state checks; no clock, no screenshots |
| T17 | CI workers | Maximize parallelism | Playwright CI page: `workers: 1` for stability, shard to scale. Default is half the cores | P13 P8 | `workers` unset |
| T18 | Browser caching | Cache `~/.cache/ms-playwright` | Docs say restore time is comparable to download | P13 | Not cached: follows |
| T19 | Pyramid vs trophy | One shape | Fowler: push tests down, few E2E. Dodds: static + integration weigh most; "tests should resemble use". Both: fewer high-level tests that repeat lower ones | S1 S2 | Closer to trophy (static, Vitest, Playwright integration): fine |

### Supply chain: only what is missing (T20 onward)

| # | Gap | Older model assumes | Correct now | Src | Repo |
|---|---|---|---|---|---|
| T20 | Action SHAs go stale | Pinned means done | Actions pins need updating. Dependabot version updates use ecosystem `github-actions`, directory `/`; its security alerts skip SHA-pinned actions (docs say so). The secure-use page also says a lockfile "supersedes" SHA pinning | A1 A2 | No `dependabot.yml`; no CODEOWNERS on `.github/workflows`. pnpm's 1-day age rule does not cover Actions |
| T21 | Enforce pinning | Convention only | REST `sha_pinning_required` (repo Actions permissions) forces full-SHA pinning | A3 | `false`; `allowed_actions:all` (gh) |
| T22 | Cache in a secret job | `cache:true` everywhere is fine | pnpm CI page: cache only where trusted jobs write; untrusted jobs must not write what trusted ones restore | N1 | Deploy job (has the Cloudflare secrets) also uses `cache: true`; set `cache:false` there. Whether PR caches can reach main was not verified |
| T23 | Audit | Lockfile + age rule is enough | `pnpm audit` (exit 1 at `audit.level`, config in `pnpm-workspace.yaml`) and `pnpm audit signatures` (registry ECDSA signatures) exist | N2 | Neither runs; both could go in the checkpoint, not the gate |
| T24 | Age rule behavior | Falls back quietly | `minimumReleaseAgeStrict` defaults true once `minimumReleaseAge` is set, so resolution fails instead of falling back. `trustLockfile` default false keeps lockfile entries re-checked | N3 | Follows; don't set `trustLockfile` |
| T25 | Cloudflare token | One token forever | Cloudflare: scope to one account/zone, use an Account API token, optionally set Client IP filtering and TTL; `cfut_` prefix helps leak scanning; check with `/user/tokens/verify`. GitHub runner IPs vary, so IP filtering is probably impractical (my inference). TTL needs a rotation habit | W1 W2 | Template scoped, secrets in the `production` environment (branch `main` only) (gh); no TTL noted. Secret scanning and push protection on (gh) |
| T26 | Deploy tool pinning | Action installs latest | `wrangler-action` uses an existing Wrangler install, else a default; an exact `wranglerVersion` gives reproducible deploys | W3 | Uses the lockfile's 4.155.0 via `packageManager: pnpm`: follows |

## 3. Sources (all fetched 2026-11-02)
- P1 https://playwright.dev/docs/test-cli (`--only-changed [ref]`, `--shard`, `--last-failed`)
- P2 https://raw.githubusercontent.com/microsoft/playwright/main/packages/playwright/src/transform/compilationCache.ts (`affectedTestFiles`)
- P3 https://raw.githubusercontent.com/microsoft/playwright/main/packages/playwright/src/runner/tasks.ts (`createLoadTask`)
- P4 https://raw.githubusercontent.com/microsoft/playwright/main/packages/playwright/src/runner/vcs.ts (`detectChangedTestFiles`)
- P5 https://github.com/microsoft/playwright/issues/43824 and https://github.com/microsoft/playwright/issues?q=only-changed
- P6 https://github.com/microsoft/playwright/releases/latest (v1.64.1) and https://playwright.dev/docs/release-notes (1.46 introduced it; 1.63 added `reducedMotion` mention)
- P7 https://playwright.dev/docs/api/class-testconfig (`failOnFlakyTests` v1.52, `workers`, `forbidOnly`)
- P8 https://playwright.dev/docs/test-retries
- P9 https://playwright.dev/docs/best-practices
- P10 https://playwright.dev/docs/api/class-testoptions (`reducedMotion` v1.50)
- P11 https://playwright.dev/docs/api/class-pageassertions (`animations`, `caret`)
- P12 https://playwright.dev/docs/clock
- P13 https://playwright.dev/docs/ci
- V1 https://vitest.dev/guide/recipes/affected-tests (docs v5.1.0)
- V2 https://vitest.dev/guide/cli (`related`, `--changed`, `--shard`)
- V3 https://vitest.dev/config/changed
- V4 https://vitest.dev/config/forcereruntriggers
- V7 https://vitest.dev/guide/migration and V8 https://vitest.dev/blog/vitest-5 (2026-09-03)
- G1 https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request
- G2 https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository
- G3 https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
- G4 https://docs.github.com/en/graphql/reference/pulls (`expectedHeadOid`) and https://cli.github.com/manual/gh_pr_merge and https://raw.githubusercontent.com/cli/cli/trunk/pkg/cmd/pr/merge/merge.go
- G5 https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets (strict vs loose)
- G6 https://docs.github.com/en/rest/repos/repos#update-a-repository (`allow_auto_merge`)
- A1 https://docs.github.com/en/actions/reference/security/secure-use
- A2 https://docs.github.com/en/code-security/dependabot/working-with-dependabot/keeping-your-actions-up-to-date-with-dependabot
- A3 https://docs.github.com/en/rest/actions/permissions (`sha_pinning_required`)
- N1 https://pnpm.io/continuous-integration
- N2 https://pnpm.io/cli/audit and https://pnpm.io/supply-chain-security
- N3 https://pnpm.io/settings/dependency-resolution and https://pnpm.io/settings/build
- W1 https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- W2 https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- W3 https://github.com/cloudflare/wrangler-action
- S1 https://martinfowler.com/articles/practical-test-pyramid.html
- S2 https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications
- Local: `vitest --help` (5.0.5), `playwright test --help` (1.64.1), `gh api` on the repo, CI run 41510108085 step timings.

Not verified: Playwright main-branch source may differ from 1.64.1; the squash-merge interaction of `--match-head-commit` after arming; whether PR-scope caches can reach main; the proposed spec map.
