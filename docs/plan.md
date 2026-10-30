# Plan: joshua.win/skill

**This is a living document.** Every session reads it first. When a phase teaches us something that changes later phases, update this file in the same PR: edit the affected phases and add a line to the change log at the bottom. Large or hard-to-reverse changes also get an ADR in `docs/adr/`.

- **Sources:** strategy v1 in [`strategy/decisions.md`](strategy/decisions.md) (the S, P and N numbers) and [`strategy/strategy.md`](strategy/strategy.md). Planning decisions are below as G1, G2…; where they differ from the strategy, they win.
- **Vocabulary:** [`../GLOSSARY.md`](../GLOSSARY.md).
- **Work tracking:** each phase starts with `/to-spec`, then `/to-tickets` into GitHub Issues, with one milestone per phase. Each ticket gets a PR with its own preview deploy.
- **Time:** there's no hours budget; the launch bar is what matters. When Josh's "too much work, too little substance" signal shows up, apply the cut list (S26) and ship.

## Status

| # | Phase | Status | At the end, you have |
|---|---|---|---|
| 0 | Planning | **done** | This plan, the glossary and the repo set up |
| 1 | Pipeline | **in progress** | A hello page at joshua.win/skill that only invite-link holders can see, noindexed, deployed on every merge with all checks running; `@joshua.win` email working |
| 2 | Lorem piece 1 and bake-off 1 | not started | A lorem essay with the parade, the `/skill` home with cards that expand into the piece, and the framework chosen |
| 3 | Lorem pieces 2 and 3 | not started | The lorem write-up as a chart playground, the heavy-treatment piece 3, the template sheet, and the *Too Loud a Solitude* cast drawn and walking |
| 4 | Style (bake-off 2) | not started | About 10 themes switchable on piece 1, the winner chosen, and the style guide |
| 5 | Content | not started | Josh's two pieces with their real treatments, the about page, the contact form, share images, RSS and the sitemap |
| 6 | Ship | not started | The launch bar met, the lorem pieces removed, the invite gate and noindex lifted: published |

---

## Phase 1: Pipeline

**Goal:** everything after this phase deploys itself, is checked automatically, and stays private.

- **Scaffold:**
  - Astro, with React for every component (G2)
  - TypeScript 6.0 strict, ESLint and Prettier (G15), pnpm 12 per [`agents/pnpm.md`](agents/pnpm.md), Node 26 LTS pinned for the project and CI with `devEngines.runtime` (G12, G14)
  - the folders: `src/pages/`, `src/layouts/`, `src/components/` (the shared library, free of framework APIs), `src/content/`, `content/lorem/`
- **Tests (G3)**, set up with one example each:
  - Vitest for unit tests
  - Vitest with Testing Library for component tests
  - Playwright for integration tests against the built site
  - `@axe-core/playwright` on every route
  - Lighthouse CI
- **CI/CD (G3):** GitHub Actions runs typecheck and lint → unit and component tests → build → Playwright and axe → Lighthouse. Each PR gets a Cloudflare Worker Preview (`wrangler preview`) and its URL is posted on the PR (G17). A merge to `main` runs `wrangler deploy`.
- **Privacy (G4):**
  - Every response carries an `X-Robots-Tag: noindex` header. A Playwright test checks it on every route, previews included (P7).
  - The invite gate: a small Worker in front of the static files. A secret invite link sets a cookie; without it, visitors get a plain placeholder page. Rotating the secret locks everyone out. Previews aren't gated (G16).
- **Routing:** `joshua.win` and `www.joshua.win` 301 to `/skill` (S8, G19).
- **Cloudflare Web Analytics** on, through the manual beacon on production only (G18).
- **The AI line (S20):** `.claude/settings.json` `ask` rules on `Edit(content/essays/**)`, `Edit(content/write-ups/**)` and `Edit(drafts/**)`. Lorem lives in `content/lorem/`, which never prompts.
- **Drafts (P6, G5):** a private repo `joshua-win-drafts`, cloned into a git-ignored `drafts/` folder. The local dev server can render drafts; CI never sees them.
  - A draft's one-off components live in `drafts/` with its prose. Each documents its props and purpose at the top of its file, so a later agent can reuse it or promote it to `src/components/`. There's a promotion checklist.
  - Publishing a piece means moving its file, plus any one-off components, into the public repo in a PR.
- **Email (P4, G9):** inbound Email Routing for the named addresses (G20); Resend for sending; SPF, DKIM and DMARC at `p=none`; Gmail "Send mail as". Josh does it in the Cloudflare and Resend dashboards, and the agent leads him through it step by step. Check the Gmail 2027 "Send as" watch item first.
- **Exit:**
  - a merged PR deploys to joshua.win/skill
  - the hello page passes every check
  - without the invite cookie you see only the placeholder
  - noindex is verified on production and on a preview
  - mail to `hello@` arrives, and a reply from `@joshua.win` passes SPF and DKIM
- **Launch-bar items started:** Email (done here), and the pipeline that Performance and Automated accessibility depend on.

## Phase 2: Lorem piece 1 and bake-off 1

**Goal:** the core reading experience exists, and the framework is settled for good.

- **The essay template:** complete, semantic, with no treatment.
- **The parade**, ported from [`demo/parade.html`](demo/parade.html) to React as the spec for its motion:
  - the walk cycle and the hip bow on the shared legs
  - clickable dots that peek on hover
  - the curtain call
  - the reduced-motion still state
  - the cast registry that maps each first mention to a cast member
  - the demo's code-drawn *Alice* figures as placeholders
- **The cast list:** whole-card links to each passage (S11).
- **The `/skill` home** (S9, S19): it leads with Josh, then big cards, newest first. Each card expands into its piece with a cross-document view transition (N1). `/skill/contents` is the plain list.
- **Bake-off 1 (S2, G13), timeboxed to about a day:** the same piece built in Next.js as a static export.
  - **Gate:** Next wins only if (a) it beats Astro by 20% or more on at least two of LCP, TBT and JS size on a throttled phone, or (b) the card-expand transition works in Next and not in Astro. Otherwise Astro wins. Josh may override.
  - **Analysis for Josh:** a full side-by-side. It covers Lighthouse mobile runs (three each), the iOS Simulator in Safari for transition behaviour, and Josh's real phone if it can be driven from the Mac (to try: iPhone Mirroring through computer use).
  - **Then:** an ADR records the verdict, and the losing build is deleted. Phase 3 can't start before both.
- **The JS cap** for Lighthouse CI is set from the measured numbers (S1).
- **Exit:** the ADR is merged, piece 1 passes every check on the winning framework, and the parade passes the interaction check (TBT and CLS after the lazy JS loads).

## Phase 3: Lorem pieces 2 and 3, and the hand-made cast

**Goal:** stress-test the stack on diagrams, a heavy treatment and real drawings, with cheap prototypes rather than polish.

- **Treatment research first (S14):** refresh [`research/visual-treatments.md`](research/visual-treatments.md) using what piece 1 taught us. It feeds pieces 2 and 3.
- **The write-up template.**
- **Lorem piece 2, the chart playground (G6, G7):** prototypes of ways to show the creative-iteration skill's steps and orchestration: which agents spin up and down, and what each does.
  - **Ideas to try:**
    - the umbrella carousel for the fan-out: clicking twists a panel forward and expands only that one (N5)
    - a scroll-driven robot whose open cranium catches a falling brain, snaps shut and switches on
    - a pixel-art battle in which the orchestrator pits ideas against each other down to the menu
    - a static Mermaid version of each, as the floor that can ship
  - **"Quirky" means delightful:** fun on top of something that reads clearly at first glance. The check for every chart: a reader who ignores the animation still gets the point.
  - **The run file:** every chart reads its content from one file listing the stages, agents, cards and counts, filled with generic placeholder names. The skill is still changing (v1 isn't settled), so the format must expect stages and agents to be added, removed and made configurable.
  - **Accessibility:** moving charts follow the S16 pattern (an `aria-hidden` visual, a visually hidden list, real buttons, and a snap instead of a spin under reduced motion).
  - Card Arm Flow is a visual reference for shape only. Its labels never enter this repo.
- **Lorem piece 3:** a heavy treatment with its own font, in MDX. The MDX verdict (S15) goes in an ADR if MDX gets in the way.
- **The template sheet (P5):** a printable page with a fixed box and a hip line that matches the shared legs' hip.
- **The first hand-made cast (S7, G8):** the *Too Loud a Solitude* cast, drawn by Josh on the template sheet:
  - a crumpled sheet of paper (the intro)
  - Haňťa
  - the giant new hydraulic press at Bubny
  - a glass of milk for the milk-drinking Socialist Labour brigade

  Hand-cleaned SVG and a hand-tuned walk. It replaces *Alice* on piece 1. Rig automation (P3) waits until this works.
- **Exit:** both pieces pass every check; the playground has at least one prototype of each idea above; the cast walks and bows on piece 1; and Josh says the hand-made cast looks right.

## Phase 4: Style (bake-off 2)

**Goal:** the house look, chosen by trying it.

- **The run (P2):** a new creative-iteration run designs about 10 styles. It starts after all three lorem pieces exist (G1).
- **Themes:** the top contenders become dev-only switchable themes on piece 1, checked against pieces 2 and 3. Josh picks the winner.
- **The style guide:** the winner sets every token category in strategy §4. One page documents them, and CI gains contrast checks for every theme and subset/`font-display` checks for every extra font.
- **Exit:** the style guide's definition of done (S22) is met on the lorem pieces.
- **Cut list:** the 10-style run is third on it (S26). If cut, Josh picks a style directly.

## Phase 5: Content

**Goal:** the two launch pieces exist, in Josh's words.

- **Josh writes** the creative-iteration write-up and the *Too Loud a Solitude* essay in `drafts/`. Agents help only when he asks (S20).
- **Real chart content:** the contrived creative-iteration run on v1 replaces the playground's placeholder run file. The chart work depends on v1's structure. If v1 isn't ready, static Mermaid ships.
- **Treatment checklists:** each piece gets a short one, written before its treatment work starts. That's the "Flair done" definition (S22).
- **Casts:** the write-up's cast, if it has one, is drawn. Rig automation (P3) happens here only if it's still worth it; it's second on the cut list.
- **The about page (S23):** a LinkedIn link, a "what I've worked on" paragraph, and an invitation to ask for a tailored résumé. It depends on the LinkedIn overhaul (N6). The contact-form Worker comes with it, with Turnstile.
- **Also:** share images rendered from each cast (PNG), RSS, and the sitemap.
- **Exit:** both pieces sit in `content/`, their treatment checklists are done, and the about page and contact form work end to end.

## Phase 6: Ship

**Goal:** publish.

1. Walk the launch bar (S22): performance, axe, the manual keyboard and VoiceOver pass, reduced motion, email, the style guide, treatment checklists and feedback.
2. Soft launch: send the invite link to 3–5 readers, then triage every comment as fix, won't fix or later, and do every fix.
3. Remove the lorem pieces.
4. Lift the invite gate and noindex. The site is now published.
5. After publishing: the URL goes on the résumé and LinkedIn Featured, with one plain LinkedIn post per piece.

---

## Planning decisions (G)

| # | Decision | Differs from strategy? |
|---|---|---|
| G1 | Six build phases as above. The style run comes after **all three** lorem pieces (Josh: "after our lorem ipsums are in place"). | P2 said after piece 1 |
| G2 | Scaffold in Astro, the stated default. Next is built only as the bake-off challenger. React Router was considered and left out: like Next, it hydrates every page. | |
| G3 | GitHub Actions for CI/CD, Cloudflare preview URLs per PR, and the test stack in phase 1. | |
| G4 | **A secret invite link (cookie, checked by a Worker) instead of Cloudflare Access.** Access's one-time code always needs an email address; Josh wants first readers to get in without one. | P8 offered an embargo or Access |
| G5 | Drafts in a private repo cloned into a git-ignored `drafts/`; a draft's one-off components stay private with it and are documented for reuse. | Settles P6 |
| G6 | The lorem write-up is a chart playground of cheap prototypes. "Quirky" means delightful and easy to follow. | |
| G7 | Charts read a run file with placeholder names; real names come from v1's contrived run. Making the skill itself configurable is the skill repo's work. | |
| G8 | The first hand-made cast is *Too Loud a Solitude* (the four members above), used as piece 1's placeholder parade. | S4 used *Alice* as the example |
| G9 | Email in phase 1 through the dashboards, led step by step; the contact form in phase 5. | |
| G10 | Josh's Gmail address was replaced with `[my Gmail]` in the repo copy of S24, at his request. | |
| G11 | The plan is a living document (this file); CLAUDE.md points every session here. | |
| G12 | pnpm 12 with its supply-chain defaults kept on, plus `trustPolicy: no-downgrade` (see `agents/pnpm.md`). Node 26 LTS everywhere; Josh's machine was upgraded on 2026-10-29. | |
| G13 | A concrete gate for bake-off 1, which Josh can override, with a full side-by-side analysis. | Sharpens S2 |
| G14 | Node is pinned with pnpm's `devEngines.runtime`, not `.nvmrc`: one source of truth that pnpm enforces locally and pnpm/setup reads in CI. | Settles the phase 1 open item |
| G15 | TypeScript 6.0, not 7: TypeScript 7.0 has no programmatic API yet, and `astro check` and typescript-eslint need 6. Lint is ESLint with typescript-eslint, the Astro plugin and jsx-a11y. Revisit TypeScript when 7.1 ships its API. | |
| G16 | PR previews aren't behind the invite gate (Josh's call). They carry noindex, and anyone with a preview URL can read that build. | |
| G17 | PR previews use Cloudflare's Worker Previews (`wrangler preview --name pr-<n>`), which Cloudflare now recommends over Version URLs for PR testing. Previews don't inherit production vars or secrets. | |
| G18 | Web Analytics uses the manual JS beacon, on production only. Cloudflare's docs don't say whether automatic setup works on Worker-served HTML. | |
| G19 | `www.joshua.win` 301s to `/skill` too, as a second custom domain on the same Worker. | Adds to S8 |
| G20 | Phase 1 email covers `hello@`, `josh@`, `gatekeeper@` and `keymaster@`. The hello and placeholder pages stay lorem until Josh writes them. | |

## Change log

- 2026-10-29: plan v1 written from the planning grill (G1–G13).
- 2026-10-29: phase 1 spec (issue #1) added G14–G20 (the Node pin, TypeScript 6 and ESLint, ungated Worker Previews, the manual analytics beacon, the `www` redirect, the email addresses). Phase 1 marked in progress.
