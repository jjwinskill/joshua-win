# Strategy: joshua.win/skill

**Status: strategy v1, ready for planning, with the adversary's picks folded in** ([adversary-v1.md](adversary-v1.md)). This file and [decisions.md](decisions.md) are the resource doc for the planning agent in the new repo. This file holds the reasoning. decisions.md holds what's settled, the adversary outcomes, the planning space, a watch item and the results the build will produce. No decisions are open.

Tags:
- **[brief]**: from the brief or your notes and answers.
- **[default]**: my call, and yours to overturn.

## The special sauce [brief]

1. **The parade.** Hand-drawn, rigged characters gather along a loading-bar edge as you read, then walk off like end credits.
   - At most four per piece, usually from a single cited work.
   - The characters are nouns from that work: characters, objects, a landmark.
   - You hand-draw the bodies only.
   - Every character uses the code-built shared legs from `demo/parade.html`: knees, feet, and a bow that bends at the hips with the legs planted.
   - The closing cast is a list of linked cards.
2. **Per-piece treatments driven by the prose.** Components inline in your prose shape the page around them.
3. **Beautiful, contemporary design**: parallax, drop shadows, fun and interesting, always serving the text. **Flash only where it makes sense.** Your no-sidebar answer made that a standing filter on every effect. [brief, S17]

## 1. The guard: accessible because it's semantic, fast because it's rendered ahead

Accessibility comes from semantic HTML: `article`, real headings, `figure`/`figcaption`, `cite`, lists, visible focus, [reduced motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) honored, and [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) contrast. [brief]

Pages are rendered to HTML ahead of time, so the text arrives before any JavaScript. Full-page hydration "can have a significant negative impact on TBT and INP" ([web.dev](https://web.dev/articles/rendering-on-the-web)), and for front-end evaluators the speed is part of the showcase. [default]

**Budget, enforced as lab data:** [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) on a throttled mobile profile, held to the [Core Web Vitals](https://web.dev/articles/vitals) "good" lines, with TBT standing in for INP, plus a JS cap set from measured numbers. Field data at the 75th percentile can't exist on a noindex site, so it becomes a goal after publishing. Heavy visual JS is lazy-loaded but **not exempt**: pages carrying it also get an interaction check for INP and CLS. [brief, S1]

**Semantic HTML is necessary, not sufficient.** axe catches only part of the problems, so the publish bar adds a manual keyboard and screen-reader pass (S22).

**Reduced motion** is the operating system's "reduce motion" accessibility setting, which browsers expose as [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion). When it's on, spinning, walking and parallax become fades or still states.

## 2. Requirements

Complete for v1.

The about page leads with you. It has the role you're after, a short bio in your voice, and the contact form. There's no résumé PDF: instead, a LinkedIn link, a "what I've worked on" paragraph, and an invitation to ask for a tailored résumé. The LinkedIn overhaul is a dependency, not a site task. [brief, S19, S23, N6]

## 3. Component library, templates and treatments

A React component library populates the templates, and each piece's treatment is built from highly composable components. [brief]

The layers [default]:
1. **Tokens.**
2. **Primitives:** prose, figure/meme frame, pull quote, aside, interactive diagram, cast cards, parade, parallax layer.
3. **Templates:** essay and write-up. Each is complete and semantic with no treatment applied.
4. **Treatment:** a theme, a component map, one-offs and a layout wrapper.

**Scope:** a treatment may change anything inside the article, but never the header or navigation. There's no sidebar at launch. [brief, S6, S17]

**Authoring:** components appear inline in the prose. MDX compiles to ordinary React, so the components work whether a piece is MDX or TSX. Lorem-ipsum piece 3 tests whether MDX ever gets in the prose's way. If it does, that kind of piece goes TSX. [brief, S3, S15]

**The AI line:** the prose file holds your words and the components you chose. Agents edit prose only when you explicitly ask, whether for editing, outlining, spell-checking, layout or effects. They may offer when something looks off. They never edit without your sign-off.

Enforcement: a `CLAUDE.md` rule plus a Claude Code [`ask` permission rule](https://code.claude.com/docs/en/permissions) on the real pieces' folders only. Lorem pieces live elsewhere, so editing them never prompts. [brief, S20]

## 4. Style guide: a standing requirement

The **standard** covers:
- a house font and type scale
- spacing
- measure
- breakpoints
- animation timings and easing
- elevation and shadows
- focus styles

A treatment may override any of it, **fonts included**, with a reason tied to the piece. [brief, S5, S6]

Overrides are scoped to the article root. Two checks run in CI [default]:
- every theme is contrast-checked
- every extra font is subset, sets [`font-display`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display), and counts against the budget

**Where the values come from:** once lorem-ipsum piece 1 exists, a new creative-iteration run designs about 10 styles. The top contenders become switchable themes on piece 1, and the winner sets the standard. It's in the planning space and hasn't started. [brief, P2]

## 5. Visual-treatment research: after piece 1

`research/visual-treatments.md` stays required. It runs after piece 1, so it starts from real data about the stack, and it feeds pieces 2 and 3. [brief, S14]

## 6. Art pipeline: bodies in, rigged characters out [brief, S7]

You draw **bodies only**, on a printable template sheet (P5) with a fixed box and a hip line that matches the code legs' hip. The legs are the shared, code-built legs from `demo/parade.html`, so no one draws legs for now.

**Hand-made before automated.** The first cast is hand-cleaned SVG with a hand-tuned walk. Only once that works does rig automation (P3) take over the repeat work. An agent would then:
1. vectorize the photo with [VTracer](https://github.com/visioncortex/vtracer), or [Potrace](https://potrace.sourceforge.net/) on a thresholded bitmap
2. align the body to the hip line
3. attach the shared legs
4. optimize with [SVGO](https://github.com/svg/svgo)
5. emit a React component that walks and bows with CSS or [Web Animations](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)

Rig automation is second on the cut list. Reduced motion shows a still line-up.

On the lorem pieces, the parade uses placeholder characters from a real cited work, as the demo does with *Alice*.

Characters should be your own caricatures, not traced likenesses of copyrighted art.

## 7. Architecture

**Framework:** React end to end. Lorem-ipsum piece 1 is built in both Astro (React for every component) and Next.js static export, **timeboxed to about a day**. They're compared on LCP, CLS, TBT, JS size and the card-expand transition, on a throttled phone. **The tie-break is stated up front:** Astro wins unless Next is clearly better, because it ships the least JS by default and is Cloudflare's own. Pieces 2 and 3 are built in the winner. [brief, S2]

Keeping the primitives free of framework-specific APIs keeps a later swap cheap. [default]

**Routes [brief, S8, S9]:**
- `joshua.win` 301s to `/skill`
- `/skill` is the showpiece: big cards, newest first, paginated at 11 or more, and each card expands into its piece ([cross-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document)).
- `/skill/contents` is the plain, text-only list of everything.
- `/skill/about`
- `/skill/essays` and `/skill/essays/:essay`
- `/skill/write-ups` and `/skill/write-ups/:write-up`

`/skill` always leads with you, and the work follows. [brief, S19]

**Diagrams [brief, S16]:**
- Static ones are Mermaid SVG rendered at build time, and that's enough to ship.
- Moving ones are bespoke React components, lazy-loaded per page. The first is the umbrella carousel, built with CSS 3D transforms. It's **first on the cut list**.
- The "Card Arm Flow" chart is a visual reference only. Its content never ships.
- The write-up's charts use placeholder content until a later, contrived run (probably on creative-iteration v1) supplies the real data. The design work now is the visual treatment of the skill's steps and orchestration. [brief, S12, N5]
- Accessibility: the visual is `aria-hidden`, with a visually hidden list or table beside it. The controls stay real buttons. Under reduced motion it snaps instead of spinning.

**Email [brief, S10]** (free, consistent, spam-filtered):
- named addresses (`hello@`, `josh@`, `gatekeeper@`…) routed free to Gmail by [Email Routing](https://developers.cloudflare.com/email-routing/), with no catch-all
- a contact form: a Worker on `/skill/api/contact` with [Turnstile](https://developers.cloudflare.com/turnstile/), sending to your verified Gmail address
- sending: Gmail stays the default, and an `@joshua.win` address is chosen per message. Replies come automatically from the address the mail was sent to. It goes through [Resend's free SMTP](https://resend.com/docs/send-with-smtp), via Gmail "Send mail as" for now, or Thunderbird identities if Gmail drops "Send as" for custom domains in January 2027. [brief, S24, P4]

**Deploy early, publish later [brief, S18]:** the site goes live with an `X-Robots-Tag: noindex` header, not a robots.txt Disallow ([why](https://developers.google.com/search/docs/crawling-indexing/block-indexing)). Publishing means lifting it.

While lorem is live, noindex doesn't stop someone who has the URL. So either don't share the URL, or put the site behind a free [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) login. Planning decides which (P8).

**Unchanged:**
- [Workers static assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/)
- images in the repo
- no CMS, no visitor-facing AI
- RSS, sitemap and share cards
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) and [axe](https://github.com/dequelabs/axe-core) in CI

## 8. Process: agents build, you decide

| Stage | Tool | You decide |
|---|---|---|
| The repo and the plan (P1) | `grill-me`, `to-spec`, `to-tickets` | scope, sign-off |
| Lorem-ipsum piece 1, built twice in about a day | `prototype` | the framework (tie-break: Astro) |
| About 10 styles as themes on piece 1 (P2) | a new creative-iteration run | the winning theme |
| Treatment research, then pieces 2 and 3 | research, `prototype` | what carries forward |
| The first cast, by hand (S7) | hand-cleaned SVG, hand-tuned walk | whether it looks right |
| Rig automation (P3), only after that | a new skill | whether its output matches the hand-made cast |
| Build | `implement` (with `tdd`, `code-review`) | merge |

Skills except creative-iteration are from [mattpocock/skills](https://github.com/mattpocock/skills).

**Adversarial review ran on v1.** Most of its picks are folded in. The 100–150 hour estimate isn't adopted, and there's no hours budget: "if it takes longer it takes longer. Again, the bar is what we care about." The ship signal is your frustration at "too much work and too little substance". Making piece 1 the real write-up and setting a ship date were rejected. [brief, S13]

## 9. Writing, launch and reach

- **Publish set:** only the creative-iteration write-up and *Too Loud a Solitude*. Until both are done, the site is deployed with noindex, and the three lorem-ipsum pieces are visible on it. [brief, S18, S25]
- **Publish bar: a bar, not a date.** Each item has a definition of done in decisions.md (S22). In brief:
  - the lab budget
  - axe plus a manual keyboard and screen-reader pass
  - reduced motion
  - email: inbound mail, the contact form, and replies from `@joshua.win` via Gmail or a mail app
  - the style guide finalized
  - each piece's treatment checklist done
  - soft-launch feedback triaged
  - then the lorem pieces removed, noindex lifted, and any Access login or URL embargo lifted

  [brief, S22]
- **Cut list**, in order, applied when your "too much work, too little substance" signal says it's time to ship: the 3D carousel, rig automation, the 10-style run, per-piece fonts. [S26]
- **After publishing:**
  1. *Snow Crash* or *The King in Yellow*.
  2. *The Shadow of the Torturer* once it has an angle.

  Cadence: weekly to biweekly, then monthly to bimonthly. [brief, N3]
- **Public repo**, as signal. Keep drafts private until they're ready (P6). [brief, S21]
- **Reach, after publishing only:** the site at the top of the résumé, LinkedIn Featured, and one plain LinkedIn post per piece. No newsletter, comments or view counts. [brief: not an influencer site; default: mechanics]

## 10. First, later, never

- **First:** the planning space in [decisions.md](decisions.md) (P1–P8). Gmail's "Send as" change no longer blocks anything, but check where it stands when setting up email.
- **Later:**
  - the Workers backend beyond the contact form
  - 90's mode, search, tags
  - a visitor-facing theme switcher, only if it passes the flash filter
- **Never:** CMS, comments, visitor-facing AI, monetization.
