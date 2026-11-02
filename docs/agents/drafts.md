# Drafts

Josh's real pieces stay private until publishing (G5, G22). They live in the private repo `joshua-win-drafts`, cloned into this repo's git-ignored `drafts/` folder. Agents edit them only when Josh asks (the AI line), and nothing from that repo ever goes into this public repo's commits, PRs or issues. Checked against Astro 7.4.4 on 2026-10-30.

## Set up

From the repo root:

```bash
gh repo clone jjwinskill/joshua-win-drafts drafts
```

Then `pnpm dev`, and open http://localhost:4321/skill/drafts/. It lists every `.md` and `.mdx` file under `drafts/`, and each one renders at `/skill/drafts/<file-name>/`. A `title` in the frontmatter is optional. The route and layout are minimal until phase 2's template.

- **If a draft is missing from the list**, restart `pnpm dev`. Astro sometimes restarts itself during startup and leaves the collection empty.
- **MDX is allowed (S15, G39).** Import a one-off from `drafts/` in the `.mdx` file and put it in the prose. A component that needs the browser takes a `client:*` directive, and it needs cleanup like any effect (G34). Tests and lint don't reach `drafts/`, so check that by hand, and add its test when it's promoted. A first mention must be written in the `.mdx` itself, not inside a component, or the mentions check can't see it. Checked against Astro 7.4.4 and @astrojs/mdx 8.1.2 on 2026-11-01.

## Where drafts appear

Only under `astro dev`. Every build gets an empty collection and has no drafts route, even with the folder present (`tests/build/drafts.test.ts`). `astro.config.mjs` decides from the command, not `import.meta.env.DEV`, which can be true in a build. Dev also caches draft text in the git-ignored `.astro/` folder, so never commit or share that. CI never has the folder. Phase 6's local soft-launch build (G22) will add its own explicit switch in `src/content.config.ts`, and CI must never be able to turn it on.

## Backup

The private repo is the backup. Commit and push from inside `drafts/` often: every push is an offsite copy with full history.

Don't put `drafts/` inside a Google Drive sync folder, because sync tools can corrupt a live `.git`. For a second copy on Drive, run this from inside `drafts/`, then put the file on Drive:

```bash
git bundle create ~/joshua-win-drafts.bundle --all
```

Run it only from inside `drafts/`. From this repo's root, it would bundle the public repo instead.

## One-off components

A component only one piece needs lives in `drafts/` with that piece. Its file starts with a comment giving its purpose and props, so a later agent can reuse or promote it.

**To promote one to `src/components/`:**

1. It's needed by more than one piece, or it's going public with one.
2. It has no draft text, private names or anything else from the piece in it.
3. It uses no Astro or framework APIs (`src/components/` must work in the bake-off too).
4. It has a component test.
5. It reaches this repo in a PR like any other code.

## Publishing

Publishing a piece is a PR that moves its file, and any one-off components, from `drafts/` into `content/essays/` or `content/write-ups/` in this repo (phase 6, step 5).
