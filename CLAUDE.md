# joshua.win/skill

A personal site of essays on media and the software zeitgeist, plus technical write-ups. Its extra piece is a hand-drawn character parade on the reading-progress bar, with per-piece visual treatments.

## Start here

1. **Read `docs/plan.md` first.** It's the living plan: phase status, what's next, and the planning decisions (G1…). When work changes what later phases should do, update it in the same PR and add a change-log line.
2. Use the vocabulary in `GLOSSARY.md`.
3. Strategy and its reasons are in `docs/strategy/` (start with `decisions.md`).
4. Read `docs/agents/local-dev.md` before running the site, merging a PR, or checking motion.

## Packages: pnpm only

Read `docs/agents/pnpm.md` before any package command. This repo uses pnpm 12 on Node 26, and much of what you remember about pnpm is out of date: settings go in `pnpm-workspace.yaml`, build scripts need `allowBuilds`, and new versions wait a day. Never use `npm`, `npx` or `yarn` here, and never weaken the supply-chain settings without asking Josh. For any tool or API you use (Astro, Wrangler, Playwright, Lighthouse CI, Cloudflare), check the current docs rather than trusting memory, and note the version you checked.

## The AI line

Josh writes all prose. Agents edit prose only when Josh explicitly asks (editing, outlining, spell-checking, layout, effects). Agents may offer help when something looks off, and never edit without his sign-off. Quotes of Josh in any doc are his words: never reword them. Lorem-ipsum pieces are not prose and are free to edit.

## Public repo

This repo is public. Never commit drafts before they're published, personal details, or anything from private tests (the Card Arm Flow chart is a visual reference only: reuse its shape, never its labels).

## Ship signal

There's no hours budget; the launch bar is what matters. If Josh shows frustration at "too much work and too little substance", say so, and point to the cut list (S26 in `docs/strategy/decisions.md`).

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `jjwinskill/joshua-win`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
