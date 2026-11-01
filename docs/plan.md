# Plan: joshua.win/skill

**This is a living document.** Every session reads it first. When a phase teaches us something that changes later phases, update this file in the same PR: edit the affected phases and add a line to the change log at the bottom. Large or hard-to-reverse changes also get an ADR in `docs/adr/`.

- **Sources:** strategy v1 in [`strategy/decisions.md`](strategy/decisions.md) (the S, P and N numbers) and [`strategy/strategy.md`](strategy/strategy.md). Planning decisions are below as G1, G2…; where they differ from the strategy, they win.
- **Vocabulary:** [`../GLOSSARY.md`](../GLOSSARY.md).
- **Work tracking:** each phase starts with `/to-spec`, then `/to-tickets` into GitHub Issues, with one milestone per phase. Each ticket gets a PR. Before merge, every PR gets an independent review: `/code-review` with fresh agents given only the diff and the ticket, told to look for what's wrong. Its findings go on the PR and are fixed or answered before Josh is asked to merge (G21). The one exception is a pure revert (G25).
- **Time:** there's no hours budget; the launch bar is what matters. When Josh's "too much work, too little substance" signal shows up, apply the cut list (S26) and ship.

## Status

| # | Phase | Status | At the end, you have |
|---|---|---|---|
| 0 | Planning | **done** | This plan, the glossary and the repo set up |
| 1 | Pipeline | **done** | A hello page at joshua.win/skill, noindexed, deployed on every merge with all checks running; mail to `@joshua.win` reaching Josh's Gmail |
| 2 | Lorem piece 1 and bake-off 1 | **done** (spec #27; Astro chosen, ADR 0001; #11 stays open for Josh's hello copy) | A lorem essay with the parade, the heavy page, the `/skill` home with cards that expand into the piece, and the framework chosen |
| 3 | Lorem pieces 2 and 3 | not started | The lorem write-up as a chart playground, the heavy-treatment piece 3, the template sheet, and the *Too Loud a Solitude* cast drawn and walking |
| 4 | Style (bake-off 2) | not started | About 10 themes switchable on piece 1, the winner chosen, and the style guide |
| 5 | Content | not started | Josh's two pieces with their real treatments, the about page, the contact form, sending from `@joshua.win`, share images, RSS and the sitemap |
| 6 | Ship | not started | The launch bar met, the lorem pieces removed, noindex lifted: published |

---

## Phase 1: Pipeline

**Goal:** everything after this phase deploys itself, is checked automatically, and stays out of search.

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
- **CI/CD (G3):** GitHub Actions runs typecheck and lint → unit and component tests → build → Playwright and axe → Lighthouse. A merge to `main` runs `wrangler deploy`.
- **Privacy (G24):** a small Worker in front of the static files gives every response an `X-Robots-Tag: noindex` header. A Playwright test checks it on every route (P7), and it was checked by hand on a preview. There's no gate: anyone who visits the domain can read the site.
- **Lorem is public too (G24):** from here on, every merge puts the lorem pieces and style tests on the live domain, noindexed.
- **Routing:** `joshua.win` 301s to `/skill` (S8); `www.joshua.win` 301s to the same path on the bare domain, and http to https (G19).
- **Cloudflare Web Analytics** on, through the manual beacon on production only (G18).
- **The AI line (S20):** `.claude/settings.json` `ask` rules on `Edit(/content/essays/**)`, `Edit(/content/write-ups/**)` and `Edit(/drafts/**)`. The leading `/` anchors them at the session's primary working directory, so start sessions at the repo root. Lorem lives in `content/lorem/`, which never prompts. They don't cover shell writes, so the CLAUDE.md rule still applies.
- **Drafts (P6, G5):** a private repo `joshua-win-drafts`, cloned into a git-ignored `drafts/` folder. The local dev server can render drafts; CI never sees them.
  - A draft's one-off components live in `drafts/` with its prose. Each documents its props and purpose at the top of its file, so a later agent can reuse it or promote it to `src/components/`. There's a promotion checklist.
  - Publishing a piece means moving its file, plus any one-off components, into the public repo in a PR.
  - **Backup (G22):** the private repo is the backup. Commit and push drafts to it often; every push is an offsite copy with full history.
- **Email (P4, G9, G27):** inbound Email Routing for the named addresses (G20), forwarding to Josh's Gmail, with a Gmail filter so they skip spam. Sending moved to phase 5. Josh does it in the dashboards, and the agent leads him through it step by step.
- **Exit:**
  - a merged PR deploys to joshua.win/skill
  - the hello page passes every check
  - noindex is verified on production and on a preview
  - mail to `hello@` arrives
- **Launch-bar items started:** Email (receiving only; sending is in phase 5), and the pipeline that Performance and Automated accessibility depend on.

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
- **The `/skill` home** (S9, S19): it leads with Josh, then big cards, newest first. Each card expands into its piece with a route transition (N1), per [`research/route-transitions.md`](research/route-transitions.md). `/skill/contents` is the plain list.
- **The heavy page (G31):** a lorem piece reached from its own card on `/skill`, with the parade, a three.js WebGL scene and an SVG chart of about 2,000 points. It's realistic heavy use, not a stress test.
- **Bake-off 1 (S2, G13, G28, G29), timeboxed to about a day:** the same pages built in Next.js as a static export, on a branch that never gets a PR.
  - **Gate (G29):** Next wins only if (a) it beats Astro by 20% or more on at least two of LCP, TBT and INP on the same page (the essay page or the heavy page), or (b) the card-expand transition works in Next and not in Astro. A metric where Astro's median is 0 counts as not beaten. Otherwise Astro wins. Josh may override. JS size and frame rate are reported, not scored.
  - **Analysis for Josh:** a full side-by-side on both builds, deployed as Worker Previews. It covers Lighthouse mobile runs (three each), the throttled scrolling, interaction and transition checks (three each), and the iOS Simulator in Safari for transition behaviour. If the results are inconclusive, Josh tries the previews on his real phone.
  - **Result:** Astro, in [`adr/0001-astro-over-next.md`](adr/0001-astro-over-next.md). The Next build is deleted.
- **No JS cap (G30).** Lighthouse CI adds the essay page and the heavy page, and JS size is reported. The throttled checks enforce INP, which Lighthouse can't measure.
- **Hooks lint (G32)** lands before the parade.
- **The transition (#45):** the card grows to fill the screen and becomes the page, with each piece of text moving to its place and the parade sliding up afterward. Josh checked it on his phone.
- **Exit:** the ADR is merged, #45 has landed, piece 1 and the heavy page pass every check on the winning framework, and the parade passes the interaction check (TBT, INP and CLS after the lazy JS loads).

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
- **Also:** share images rendered from each cast (PNG), RSS, the sitemap, the `/skill/essays/` index and a custom 404 (G33).
- **Sending from `@joshua.win` (G27):** Resend, DMARC at `p=none`, and a reply path. Gmail's "Send as" has probably ended by now, so check it first; Thunderbird is the fallback (P4).
- **Exit:** both pieces are finished in `drafts/` (they stay out of the public repo until publishing, G22), their treatment checklists are done, the about page and contact form work end to end, and a reply from `@joshua.win` passes SPF and DKIM.

## Phase 6: Ship

**Goal:** publish.

The real pieces stay out of this public repo and out of CI until step 5 (G22).

1. Walk the launch bar (S22): performance, axe, the manual keyboard and VoiceOver pass, reduced motion, email, the style guide, treatment checklists and feedback. Until step 5, CI can't see the pieces, so run the automated checks on them locally against a soft-launch build.
2. Soft-launch deploy: from Josh's machine, an explicit local build that includes `drafts/`, deployed with `wrangler deploy`. Anyone who visits the domain can read it (G24), so Josh decides here whether that's acceptable for real pieces. Build it with `PUBLIC_CF_ANALYTICS_TOKEN` set, or readers won't be counted. CI's deploy on merge to `main` would overwrite it with a build that has no pieces, so add a pause (a repository variable in the deploy job's `if`), or merge nothing to `main`, until step 5.
3. Soft launch: send the URL to 3–5 readers, then triage every comment as fix, won't fix or later, and do every fix.
4. Remove the lorem pieces, including the heavy page (G31).
5. The publishing PR: move the pieces and their one-off components into `content/`, and lift noindex, all together (and consider adding HSTS), so the pieces enter the public repo only in that PR. CI's checks now cover them. Merging it publishes the site.
6. After publishing: the URL goes on the résumé and LinkedIn Featured, with one plain LinkedIn post per piece.

---

## Planning decisions (G)

| # | Decision | Differs from strategy? |
|---|---|---|
| G1 | Six build phases as above. The style run comes after **all three** lorem pieces (Josh: "after our lorem ipsums are in place"). | P2 said after piece 1 |
| G2 | Scaffold in Astro, the stated default. Next is built only as the bake-off challenger. React Router was considered and left out: like Next, it hydrates every page. | |
| G3 | GitHub Actions for CI/CD and the test stack in phase 1. Previews are on demand (G26). | |
| G4 | **Reversed by G24.** A secret invite link (cookie, checked by a Worker) instead of Cloudflare Access. Access's one-time code always needs an email address; Josh wants first readers to get in without one. | P8 offered an embargo or Access |
| G5 | Drafts in a private repo cloned into a git-ignored `drafts/`; a draft's one-off components stay private with it and are documented for reuse. | Settles P6 |
| G6 | The lorem write-up is a chart playground of cheap prototypes. "Quirky" means delightful and easy to follow. | |
| G7 | Charts read a run file with placeholder names; real names come from v1's contrived run. Making the skill itself configurable is the skill repo's work. | |
| G8 | The first hand-made cast is *Too Loud a Solitude* (the four members above), used as piece 1's placeholder parade. | S4 used *Alice* as the example |
| G9 | Email through the dashboards, led step by step: receiving in phase 1 and sending in phase 5 (G27); the contact form in phase 5. | |
| G10 | Josh's Gmail address was replaced with `[my Gmail]` in the repo copy of S24, at his request. | |
| G11 | The plan is a living document (this file); CLAUDE.md points every session here. | |
| G12 | pnpm 12 with its supply-chain defaults kept on, plus `trustPolicy: no-downgrade` (see `agents/pnpm.md`). Node 26 LTS everywhere; Josh's machine was upgraded on 2026-10-29. | |
| G13 | A concrete gate for bake-off 1, which Josh can override, with a full side-by-side analysis. Its metrics are changed by G29. | Sharpens S2 |
| G14 | Node is pinned with pnpm's `devEngines.runtime`, not `.nvmrc`: one source of truth that pnpm enforces locally and pnpm/setup reads in CI. The pin is an exact version, because CI installs Node from it rather than from the lockfile. | Settles the phase 1 open item |
| G15 | TypeScript 6.0, not 7: TypeScript 7.0 has no programmatic API yet, and `astro check` and typescript-eslint need 6. Lint is ESLint with typescript-eslint, the Astro plugin and jsx-a11y. Revisit TypeScript when 7.1 ships its API. | |
| G16 | Previews are open (Josh's call). They carry noindex, and anyone with a preview URL can read that build. | |
| G17 | Previews use Cloudflare's Worker Previews (`wrangler preview --name <name>`), which Cloudflare now recommends over Version URLs for PR testing. Previews don't inherit production vars or secrets. | |
| G18 | Web Analytics uses the manual JS beacon, on production only. Cloudflare's docs don't say whether automatic setup works on Worker-served HTML. | |
| G19 | `www.joshua.win` 301s to the bare domain as a second custom domain on the same Worker, keeping its path (Josh: keep paths so missing pages reach the real 404 "instead of 301-ing everything"). `www.joshua.win/` lands on `/skill/`. Public hosts are https-only: the Worker upgrades http itself. | Adds to S8 |
| G20 | Phase 1 email covers `hello@`, `josh@`, `gatekeeper@` and `keymaster@`. The hello page stays lorem until Josh writes it. | |
| G21 | Every PR gets an independent, adversarial review by fresh agents before merge (see Work tracking). Added after the scaffold PR merged with only its author's checks and CI. | |
| G22 | The real pieces stay private until publishing: in `drafts/` and its private repo, which is also their backup. The soft-launch deploy is built and deployed locally from Josh's machine, and they enter this public repo only in the publishing PR (Josh: "Let's keep them private."). Since G24, the deployed soft launch isn't private: only the repo is. | Changes phases 5 and 6 |
| G23 | No zone-level noindex rule (it would outlive publishing). | |
| G24 | **No invite gate.** Anyone who visits the domain can read the site, and noindex keeps it out of search. Josh only wanted cover while testing designs and before content, and "our whole secret strategy is probably overkill". The gate, its secret and placeholder page, and the HSTS and log settings that existed for it are gone. | Reverses G4 |
| G25 | A PR containing only GitHub's revert of an already reviewed PR skips the independent review of G21, to save time in an incident. | Exception to G21 |
| G26 | **Previews run on demand from Josh's machine, with no CI token.** A token that PR branches can reach could also overwrite production, which would undo the `main`-only rule for deploys (Josh: "do we really need a separate token if that token can also overwrite main?"). Revisit with a trusted workflow if on-demand gets annoying. | Changes G3 and G17 |
| G27 | Phase 1 email is receiving only. Sending moves to phase 5, because the reply path needs Thunderbird, which Josh wants only once there's enough mail to warrant it. It stays on the launch bar. | Changes G9 and phase 1's exit |
| G28 | The Next build lives on a branch with no PR, in its own folder with its own manifest, lockfile and supply-chain settings. Both builds are compared as deployed Worker Previews. Josh's bar: "we are able to compare the two in a deployed context" and it "sets us up properly to remove one when we choose the other". | Settles S2's setup |
| G29 | The gate scores LCP, TBT and INP, with both beaten metrics on the same page (the essay page or the heavy page), and a metric where Astro's median is 0 counts as not beaten. JS size is out of the gate, but Josh still gets it in the report. | Changes G13 |
| G30 | **No JS cap**, unless there's a specific reason for one (Josh: "our goal here is not to ship as little js as possible, our goal is to have good UX, which we can attain within acceptable performance criteria"; "Only use a cap if we have a specific reason to."). This also applies where S22 says "passes S1". The LCP, CLS and TBT lines stay, and INP ≤ 200 ms is added through the throttled checks. A page may have its own limit only with Josh's OK and a recorded reason, for a minor miss that buys an especially good visual. | Reverses S1's JS cap |
| G31 | The heavy page stays on the winner until phase 6 as the performance canary. It's realistic for an essay or write-up, not a stress test. | |
| G32 | Hooks lint uses `eslint-plugin-react-hooks` and the leak rules from `@eslint-react/eslint-plugin`, as errors, with `--max-warnings 0`. Josh approved one `trustPolicyExclude` entry, exactly `semver@6.3.1`. | Adds an exception to G12 |
| G33 | Pagination waits until there are 11 pieces. The `/skill/essays/` index and a custom 404 move to phase 5. | Defers part of S9 and S8 |
| G34 | Astro's `<ClientRouter />` runs the card transition, not native cross-document transitions. Chrome on iOS jumps on any full-page navigation, with or without a transition, and in Josh's phone test same-document navigation avoided it everywhere except Chrome's own back arrow (`docs/research/ios-chrome-view-transitions.md`). Astro's bug #18377, where Back leaves the site in Chrome on iOS, is still open: it didn't appear in that test, but check it after each upgrade. It adds about 5.7 KB gzipped to every page, and turns on prefetching on hover. Josh: "The delight of the transitions is very important in an application that showcases my FE talents". Revisit if browsers fix the jump. | Reverses the "no `<ClientRouter />`" call in `docs/research/route-transitions.md` |

## Change log

- 2026-10-29: plan v1 written from the planning grill (G1–G13).
- 2026-10-29: phase 1 spec (issue #1) added G14–G20 (the Node pin, TypeScript 6 and ESLint, ungated Worker Previews, the manual analytics beacon, the `www` redirect, the email addresses). Phase 1 marked in progress.
- 2026-10-29: the review of the scaffold PR made G14's pin an exact version, and added G21 (independent review on every PR, in Work tracking).
- 2026-10-29: the Worker PR (#3) changed G19: `www` keeps its path instead of always landing on `/skill/` (Josh's call after review), and the Worker upgrades http to https on public hosts.
- 2026-10-30: the invite gate's review (#4) raised an open question at phase 6 step 2: the public repo exposes real pieces before the gate lifts.
- 2026-10-30: G22 answers that question: the pieces stay private until publishing, the soft-launch deploy is local, and the drafts repo is the backup. Phase 5's exit and phase 6's steps changed to match.
- 2026-10-30: the production deploy (#6) added G23: HSTS, no zone-level noindex, no Workers Logs. Phase 6 should consider raising HSTS.
- 2026-10-30: G24 removes the invite gate before anything deployed (Josh's call), reversing G4 and cutting G23 to its noindex rule. The first deploy is now the first merge. Phase 6's soft launch isn't private on the site, and Josh decides at step 2 whether that's enough.
- 2026-10-30: the first deploy failed because Cloudflare refused `assets.base_path` for this account (code 100343). Astro now builds into `dist/skill/`, so #7's previews and #5's Lighthouse should expect that layout.
- 2026-10-30: a rollback test (#18, #19) proved both the Cloudflare rollback and the GitHub revert. The steps are in `agents/local-dev.md`, and G25 exempts pure reverts from G21.
- 2026-10-30: the drafts PR (#9) keeps drafts to `.md` until phase 3's MDX decision (S15), since one-off components need MDX. Phase 6's soft-launch build must add its switch in `src/content.config.ts`.
- 2026-10-30: the axe and Lighthouse PR (#5) measures only the home page. Phase 2 should add the essay page to `lighthouserc.cjs` when it sets the JS cap.
- 2026-10-30: G26 replaces a preview on every PR with on-demand previews, so #7 adds no CI job or token. `preview_urls` is on in production, which also makes Version URLs public.
- 2026-10-30: phase 1 done. G27 moves sending from `@joshua.win` to phase 5, with its exit check. #11 (the hello copy) stays open and never blocked phase 1.
- 2026-10-31: phase 2 spec (#27) added G28–G33: the bake-off on a no-PR branch and deployed previews, the new gate (changes G13), no JS cap (reverses S1's), the heavy page as canary, hooks lint and deferred scope. Phase 2 marked in progress.
- 2026-10-31: the transitions research (#28) found Next's morph doesn't run on browser back, in Chromium or iOS Safari, while Astro's does. #35 reports this instead of requiring it. Going back after scrolling down an essay is untested, so #32 and #35 must check it.
- 2026-10-31: the home page (#32) found the morph flies in from over 6,000 px away when going back from far down an essay. A small script in the layout crossfades off-screen elements instead, so the transition isn't quite JS-free. Josh asked to keep building with Cloudflare previews and review the pages visually as they land.
- 2026-10-31: Josh asked for each piece of the card's text to move to its place instead of fading, so both bake-off builds were measured with that transition (#45). The rest of #45 (the card filling the page, the parade's entrance, the movement on his phone) must land before phase 2 ends.
- 2026-10-31: phone tests in Chrome on iOS found the jump comes from full-page navigation itself, so G34 moves the transition to `<ClientRouter />`. Scripts and islands now live through page swaps, so later phases' effects must clean up on unmount and have a test that reaches them from another page.
- 2026-10-31: Josh chose Astro (ADR 0001), and the Next build is deleted. Phase 2 stays open until #45 lands, which Josh asked for before the phase ends. Phase 3 can start planning from Astro with `<ClientRouter />`, and its pieces must clean up across page swaps.
- 2026-10-31: the heavy page (#34) marks its figures with an empty element in Markdown until phase 3's MDX decision (S15). If MDX wins, the figures become components in the prose and the marker goes. Phase 6 removes the page with the lorem pieces.
- 2026-10-31: the transition (#45) landed, and phase 2 is done. Essay pages are now the card's color. A piece's treatment must work on that background, and its parade must stay out of the transition until the card has landed. Chrome's back arrow on iOS still jumps before morphing, which comes from the browser.
- 2026-10-31: a retro on phase 2 added merge steps and a way to check motion to `agents/local-dev.md`. Phase 3's moving charts should use the contact-sheet check and go to Josh's phone for sign-off.
