# pnpm in this repo

**Read this before running any package command.** Your training data almost certainly describes pnpm 8–10 and Node's Corepack. Both are out of date here. Every fact below was checked against pnpm's own docs and the installed CLI on 2026-10-29 (pnpm 12.16.1, Node 26.13.0).

**When this file and your memory disagree, this file wins.** When this file and the installed CLI disagree, the CLI wins: check `pnpm help <command>` or https://pnpm.io, fix this file in the same PR, and add the date.

## Rules for agents

1. Use pnpm only. Never `npm install`, `npm i`, `npx`, `yarn` or `bun` in this repo; a second lockfile or a flat `node_modules` breaks the install.
   - add a dependency: `pnpm add <pkg>` (dev: `pnpm add -D <pkg>`)
   - run a one-off tool without installing it: `pnpm dlx <pkg>` (or the `pnx` / `pnpx` shims)
   - run a script: `pnpm <script>` or `pnpm run <script>`
   - clean reinstall: `pnpm ci` (clean, then install with a frozen lockfile)
2. Settings live in **`pnpm-workspace.yaml`**, not `.npmrc`. pnpm reads only auth, registry, TLS, proxy and `local-address` from `.npmrc`.
3. Unknown keys in `pnpm-workspace.yaml` warn, and fail with `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` when the project pins pnpm. A setting name from memory that fails this way is probably stale: look it up, don't silence it.
4. Never weaken the supply-chain settings below to get an install through. Stop and ask Josh.

## Supply-chain settings (the reason we use pnpm)

| Setting | Default | Ours | What it does |
|---|---|---|---|
| `allowBuilds` | unlisted = blocked | an explicit map | Which dependencies may run install scripts. `pnpm approve-builds` writes entries here. Expect `esbuild`, `workerd` and `sharp` to need approval; approve only what a package truly needs, and tell Josh. |
| `strictDepBuilds` | `true` | `true` | Install fails if any dependency has an unreviewed build script. |
| `dangerouslyAllowAllBuilds` | `false` | never `true` | Would run every build script. |
| `minimumReleaseAge` | `1440` (minutes, one day) | `1440` | Won't install a version published less than a day ago. |
| `minimumReleaseAgeExclude` | none | empty | Bypass by package name. Only with Josh's OK, for an urgent security patch. |
| `blockExoticSubdeps` | `true` | `true` | Only direct dependencies may come from git URLs or tarballs. |
| `trustPolicy` | `off` | `no-downgrade` | Fails if a package's trust level (for example its provenance) drops from earlier releases. |
| `trustPolicyExclude` | none | `semver@6.3.1` | Exact versions excused from `trustPolicy`, each with Josh's OK (G32). |

**Removed settings that agents still reach for:** `onlyBuiltDependencies` and `ignoredBuiltDependencies` were removed in v11 and replaced by `allowBuilds` (`name: true | false`). `pnpm ignored-builds` lists what was blocked.

## Changed in pnpm 12

- `--frozen-lockfile false` is gone; use `--no-frozen-lockfile`. In CI, pnpm uses a frozen lockfile automatically.
- pnpm can manage the Node runtime itself (`pnpm runtime`; `pnpm env` is deprecated), and `globalShims` makes a global `node` follow a project's `devEngines.runtime` pin.
- `sudo` with global commands fails on purpose.

## How this repo pins Node (decided in phase 1, 2026-10-29)

**Node is pinned with `devEngines.runtime` in `package.json`, not `.nvmrc`** (Josh's call, phase 1 spec #1). There is deliberately no `.nvmrc`: `devEngines.runtime` is the one source of truth, and the lockfile and the agent-shell path below follow it.

- The pin is an **exact version** (`26.13.0`), not a range. CI's `pnpm/setup` (v3.1.2) installs Node from the `devEngines.runtime` value and then runs `pnpm install --no-runtime`, so it does **not** use the lockfile's Node. With a range, CI could run a newer Node than the lockfile records (seen in the CI logs on 2026-10-29: `Installing runtime node@^26.0.0`).
- `pnpm install` downloads that Node if needed (`onFail: download`) and locks its checksum in `pnpm-lock.yaml` (it shows up as a `node` dev dependency in the install output). Locally the checksum is checked; in CI it isn't, because of `--no-runtime`.
- Every `pnpm <script>` and `pnpm exec` runs under the locked Node, because pnpm links it as `node_modules/.bin/node`. Checked: with Node 24 first on PATH, `pnpm exec node -v` prints v26.13.0.
- A bare `node` typed in a shell is **not** pinned (no global shims are installed), so run project code through pnpm.
- In CI, `pnpm/setup` reads the same pin when its `runtime` input is omitted.
- To upgrade Node: change the version in `devEngines.runtime`, run `pnpm install`, and commit both files. Update the agent-shell path below too.

**Agent shells:** they can inherit an older nvm Node on PATH with no `pnpm` on it. If `pnpm` isn't found, prepend the Node 26 bin folder first: `export PATH="$HOME/.nvm/versions/node/v26.13.0/bin:$PATH"`.

## Installing and updating pnpm

- Node 26 doesn't bundle Corepack, so don't use `corepack enable`. pnpm was installed with `npm install -g pnpm@latest` (the one place npm is used) and updates with `pnpm self-update`.
- The project pins its pnpm version in `package.json` (`packageManager`, which `pnpm init` writes).

## CI (GitHub Actions)

pnpm's current CI guide uses **`pnpm/setup`**, not the older `pnpm/action-setup` plus `actions/setup-node` pair:

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
- uses: pnpm/setup@fa36a5ef7dcdefc3a7cb25655c122e00cf6e636e # v3.1.2
  with:
    cache: true
    require-lockfile: true
```

It installs pnpm (version from `packageManager`), installs Node from `devEngines.runtime` (so no `runtime` input), and runs the install. `require-lockfile: true` makes a missing lockfile fail the job instead of being written. Pin actions to the commit, not the tag (the SHAs above were checked on 2026-10-29). Check https://pnpm.io/continuous-integration and the pnpm/setup README before changing the workflow. The workflow is `.github/workflows/ci.yml`.

## Known local notes

- `pnpm doctor` from an agent sandbox reported no write access to `~/Library/pnpm/store/v11`. The first real install (2026-10-29) used that store without trouble, so it was the sandbox.
- `trustPolicy: no-downgrade` blocks `semver@6.3.1` (flagged as a possible takeover), which `eslint-plugin-react-hooks` pulls in through `@babel/core`. Josh approved one exclusion on 2026-10-31 (G32): `trustPolicyExclude` names exactly that version, and every other check stays on. 6.3.1 was published in July 2023, after the 7.5.x releases. Add a new entry only with Josh's OK.
- `eslint-plugin-jsx-a11y` 6.10.2 doesn't list ESLint 10 as a peer, so `pnpm install` warns. Its rules were checked to fire under ESLint 10 in both `.tsx` and `.astro` files. The plugin-astro docs name `eslint-plugin-jsx-a11y-x` as an alternative if it ever breaks.
- Wrangler 4.155.0 pulls in a **beta** Miniflare (`miniflare@5.20261023.2-beta`) as a dependency, which is Wrangler's own choice, not ours. It runs only in local dev and tests (`wrangler dev`), never in the deployed Worker.
- `pnpm add wrangler` gave 4.155.0, not the newest 4.156.0, because `minimumReleaseAge` waits a day. That's working as intended.
- A stray `node_modules` in the home folder broke `astro build`, because Node resolves packages by walking up the folder tree. Keep no `package.json` or `node_modules` above the repo.
