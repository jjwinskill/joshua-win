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

**Removed settings that agents still reach for:** `onlyBuiltDependencies` and `ignoredBuiltDependencies` were removed in v11 and replaced by `allowBuilds` (`name: true | false`). `pnpm ignored-builds` lists what was blocked.

## Changed in pnpm 12

- `--frozen-lockfile false` is gone; use `--no-frozen-lockfile`. In CI, pnpm uses a frozen lockfile automatically.
- pnpm can manage the Node runtime itself (`pnpm runtime`; `pnpm env` is deprecated), and `globalShims` makes a global `node` follow a project's `devEngines.runtime` pin. Phase 1 decides whether we pin Node there or with `.nvmrc`, and records it here.
- `sudo` with global commands fails on purpose.

## Installing and updating pnpm

- Node 26 doesn't bundle Corepack, so don't use `corepack enable`. pnpm was installed with `npm install -g pnpm@latest` (the one place npm is used) and updates with `pnpm self-update`.
- The project pins its pnpm version in `package.json` (`packageManager`, which `pnpm init` writes).

## CI (GitHub Actions)

pnpm's current CI guide uses **`pnpm/setup`**, not the older `pnpm/action-setup` plus `actions/setup-node` pair:

```yaml
- uses: actions/checkout@v6
- uses: pnpm/setup@<commit-sha> # v3.1.2 as of 2026-10-29: pin to the commit, not the tag
  with:
    runtime: node@26
    cache: true
```

It installs pnpm (version from `packageManager`), installs Node through pnpm, and runs the install. Check https://pnpm.io/continuous-integration before writing the workflow.

## Known local note

`pnpm doctor` from an agent sandbox reported no write access to `~/Library/pnpm/store/v11`. That's probably the sandbox, not the machine. Check it on the first real `pnpm install` in phase 1.
