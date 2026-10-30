# Decisions: strategy v1

**Status: v1-ready, with the adversary's picks folded in** ([adversary-v1.md](adversary-v1.md)). This file and [strategy.md](strategy.md) are the planning agent's resource doc for the new repo.

No decisions are open. What's left is a watch item and the results the build will produce.

The parts below:
- **Settled:** decisions with your reasons (quotes are yours).
- **Adversary outcomes:** what was adopted, set aside and rejected.
- **Planning space:** work that hasn't started.
- **Noted:** opportunities and background.
- **Open:** what's left.

---

## Settled

| # | Decision | Your reason |
|---|---|---|
| S1 | **Performance budget, enforced as lab data:** [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) on a throttled mobile profile, checked against the [Core Web Vitals](https://web.dev/articles/vitals) "good" lines (LCP ≤ 2.5 s, CLS ≤ 0.1) and against [TBT](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time) as the lab stand-in for INP, plus a JS cap set from measured numbers. Field CWV at p75 can't exist on a noindex site with no traffic; it becomes a goal after publishing. Lazy-loaded heavy JS is **not exempt**: pages with the parade or moving diagrams also get an interaction check for INP and CLS. | "this is good, yes"; wording fixed after the adversary pass |
| S2 | **Framework bake-off, timeboxed to about one day:** Astro (React for every component) against Next.js static export, on lorem-ipsum piece 1. Compare LCP, CLS, TBT and JS size on a throttled phone, plus how the card-expand transition behaves. **Tie-break, stated up front:** Astro wins unless Next is clearly better on the numbers or clearly easier for a whole-page treatment, because Astro ships the least JS by default and is Cloudflare's own. | "the proof is in trying it out"; the timebox and tie-break come from the adversary pass |
| S3 | **The prose directs the page:** components appear inline in the prose. | "far more dynamic than anyone else's blog" |
| S4 | **Lorem-ipsum pieces stay.** They test the stack and the styling, not the prose. The parade on them uses placeholder characters from a real cited work, as [demo/parade.html](../demo/parade.html) does with *Alice*. | To "see what the limitations and features of our stack are" |
| S5 | **Fonts:** one house font. A treatment may bring its own for a reason. Fourth on the cut list (S26). | "reason tied to any deviation from the norm" |
| S6 | **Treatment scope:** anything inside the article. Never the header or navigation. A treatment may override style-guide values when it's pertinent. | A standard, with deviation where it helps. |
| S7 | **The parade rig:** at most four nouns per piece, usually from one cited work. You hand-draw **bodies only**, on the template sheet (P5). **The legs are the code-built shared legs from [demo/parade.html](../demo/parade.html):** thigh, shin and foot, with a knee bend and a bow at the hips with the legs planted. **Hand-made before automated:** the first cast is hand-cleaned SVG with a hand-tuned walk, and rig automation (P3) comes only after that works. | "content to just go with the legs we currently have since that seems like a big enough lift to impede us" |
| S8 | **Routes:** see the list below this table. | Each piece carries its own style. |
| S9 | **`/skill` is the showpiece:** big cards, newest first, paginated at 11 or more, with the card-expands transition. **`/skill/contents` is the plain list.** | "yep" |
| S10 | **Email:** named addresses only, routed free to Gmail by Email Routing, with no catch-all. The contact form is a Worker sending to your verified Gmail address. Sending from `@joshua.win` goes through Resend's free SMTP (S24). | "free, consistent, and spam-filtered" |
| S11 | **Closing cast:** a list of linked cards, for now. | Your note. |
| S12 | **First write-up:** how the creative-iteration skill was built. Its charts use **placeholder content** until a later, contrived run (probably on creative-iteration v1) supplies the real data. The planning work is the **visual treatment of the skill's steps and orchestration.** | "we can use placeholder for that for now, the important piece is the visual representation" |
| S13 | **Adversarial review only after v1.** Done: see Adversary outcomes. | Your instruction. |
| S14 | **Treatment research runs after lorem-ipsum piece 1.** | "so we get some data" |
| S15 | **MDX is tested on lorem-ipsum piece 3.** | "Sure that works" |
| S16 | **Diagrams:** static ones are Mermaid SVG rendered at build time, and **that's enough to ship.** Moving ones (the umbrella carousel, N5) are bespoke React components, lazy-loaded, and the **first thing cut** when it's time to ship. See below this table for the accessibility pattern. | "I'm ok with heavy js on these, it's visual flare" |
| S17 | **No sidebar at launch.** | "save on being too flashy where it doesn't make sense" |
| S18 | **Deploy early, publish later.** The site goes live with an `X-Robots-Tag: noindex` header, not a robots.txt Disallow ([Google](https://developers.google.com/search/docs/crawling-indexing/block-indexing)). Publishing means removing noindex once the publish bar is met. **While lorem is live,** either don't share the URL or put the site behind a free Cloudflare Access login (P8 decides which). | "wait to publish until we have at least 2 articles" |
| S19 | **`/skill` always leads with you**, and the work follows. | "The /skill page should always lead with me" |
| S20 | **The AI line:** agents edit prose only when explicitly asked (editing, outlining, spell-checking, layout, effects). They may offer help, and never edit without your sign-off. Enforced by a `CLAUDE.md` rule and an [`ask` permission rule](https://code.claude.com/docs/en/permissions) that covers **the real pieces' files only, not the lorem pieces**, for example `Edit(/content/essays/**)` and `Edit(/content/write-ups/**)`, with lorem kept elsewhere. | "never make direct edits without a human's sign off" |
| S21 | **Public repo**, with drafts kept private (P6). | "another piece of signal about my skillset" |
| S22 | **Publish bar: a bar, not a date.** Each item has a definition of done; see below this table. | "bar is the correct line here" |
| S23 | **No résumé PDF on the about page.** It has a LinkedIn link, a "what I've worked on" paragraph, and an invitation to ask for a tailored résumé. Depends on the LinkedIn overhaul (N6). | "Yes, correct" |
| S24 | **Sender:** Gmail stays the default. Pick an `@joshua.win` address for any message, and replies come from the address the mail was sent to. Resend is the one third party (P4). | "keep [my Gmail] for my default correspondence but be able to switch my sender" |
| S25 | **Publish with two pieces only:** the creative-iteration write-up and *Too Loud a Solitude*. | "we'll ship with only the first two" |
| S26 | **Cut list,** in order, applied when it's time to ship (your "too much work, too little substance" signal), not by hours: (1) the 3D carousel, (2) rig automation, (3) the 10-style run, (4) per-piece fonts. | Adopted from the adversary pass; triggered by your signal, not a clock |

The routes (S8):
- `joshua.win` 301s to `/skill`
- `/skill/about`
- `/skill/essays` and `/skill/essays/:essay`
- `/skill/write-ups` and `/skill/write-ups/:write-up`
- `/skill/contents`

The email addresses (S10): `hello@`, `josh@`, `gatekeeper@`, `keymaster@`, and so on.
- Email Routing allows 200 rules per domain ([limits](https://developers.cloudflare.com/email-routing/limits/)).
- It hands upstream errors back to the sender rather than dropping mail silently ([postmaster](https://developers.cloudflare.com/email-routing/postmaster/)).
- Spam filtering happens in Gmail.
- Resend's free plan covers 3,000 emails a month and 100 a day ([pricing](https://resend.com/pricing)).

The accessibility pattern for moving diagrams (S16):
- The visual is `aria-hidden`, with a visually hidden list or table beside it.
- The controls stay real buttons. Never put `aria-hidden` on anything focusable.
- Under reduced motion it snaps instead of spinning.
- How this reads to screen-reader users needs real testing in the manual pass (S22).

### Publish bar (S22), with definitions of done

| Item | Done when |
|---|---|
| Performance | Lighthouse CI passes S1 on every published route, throttled mobile, three runs. Pages with the parade or diagrams also pass an interaction check (TBT and CLS after the lazy JS loads). |
| Automated accessibility | [axe](https://github.com/dequelabs/axe-core) reports zero violations on every published route. |
| Manual accessibility | A keyboard-only walkthrough of every published page: everything reachable, focus always visible, no traps. Then a [VoiceOver](https://support.apple.com/guide/voiceover/welcome/mac) pass through both pieces, including the diagram lists and the cast cards. Every issue found is fixed. |
| Reduced motion | With the OS setting on, nothing walks, spins or parallaxes, and each moving thing shows its still state. Moving content also has a check against [pause, stop, hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html). |
| Email | Mail to each named address arrives. The contact form delivers end to end. A reply from `@joshua.win` (Gmail "Send as" **or** a mail app) arrives with SPF and DKIM passing. Gmail's 2027 change can't block this. |
| Style guide finalized | Every token category in strategy §4 has a value, one page documents them, and the two pieces use no hard-coded values outside the tokens. |
| Flair done | Each piece has a short treatment checklist, written before work starts. It's done when every item is built, or moved to "after publishing", or cut under S26. Static Mermaid counts. |
| Feedback addressed | 3–5 readers have read both pieces. Every comment is marked fix, won't fix or later, and every "fix" is done. |
| Then | Lorem pieces removed, noindex lifted, and any Access login or URL embargo (P8) lifted. |

## Adversary outcomes

- **Adopted:**
  - S1 (lab enforcement, no exemption for lazy JS)
  - S2 (timebox and tie-break)
  - S4 and S18 (lorem stays; URL embargo or Access)
  - S7 (hand-made before automated)
  - S16 (carousel cut first)
  - S20 (`ask` rule on real pieces only)
  - S22 (manual accessibility pass, definitions of done, an email item Gmail can't block)
  - S26 (cut list)
- **Not adopted:** the 100–150 hour estimate, and any hours budget. Time doesn't matter; the bar does. Your words: "This is a personal site and I want to use it for professional reasons but also this is a labor of love and if it takes longer it takes longer. Again, the bar is what we care about. We don't really care about time until I start just getting frustrated because there's been too much work and too little substance. That will give us some signal that maybe it's time to publish." ("just ship it"). The ship signal is your frustration at too much work and too little substance. When it shows up, apply the cut list (S26) and ship.
- **Rejected:**
  - Making piece 1 the real write-up, because styling comes before the write-up's content.
  - A ship date. The bar stays a bar.

## Planning space (not started)

- **P1. The repo and the plan.**
- **P2. Style exploration.** Once lorem-ipsum piece 1 exists, a new creative-iteration run designs about 10 styles. The top contenders become switchable themes on piece 1 (dev-only by default), and the winner sets the style guide. Third on the cut list.
- **P3. Rig automation**, only after the hand-made first cast works (S7). It vectorizes a photo of a body ([VTracer](https://github.com/visioncortex/vtracer), or [Potrace](https://potrace.sourceforge.net/) on a thresholded bitmap, not a raw photo), aligns it to the template's hip line, attaches the shared code legs, optimizes ([SVGO](https://github.com/svg/svgo)), and emits a React component. Second on the cut list.
- **P4. Email setup:**
  - Email Routing rules
  - DKIM for Resend, SPF merged into one record, and a DMARC record (starting at `p=none`)
  - the contact-form Worker with [Turnstile](https://developers.cloudflare.com/turnstile/) and a `send_email` binding
  - sending via Gmail ["Send mail as"](https://support.google.com/mail/answer/22370) with "Reply from the same address the message was sent to", or [Thunderbird](https://www.thunderbird.net/) identities through Resend if Gmail drops custom domains
- **P5. The template sheet, bodies only.** A printable page with a fixed box and a marked hip line that matches the code legs' hip, so every body is drawn at the same scale and attaches at the same point. Photograph it flat and evenly lit.
- **P6. Keeping drafts private in a public repo**: a private repo or a git-ignored folder until they're ready.
- **P7. The noindex deploy**, with a check that the header is on every route.
- **P8. Pre-launch privacy:** don't share the URL while lorem is live, or put the site behind a free [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) login ([plans](https://www.cloudflare.com/plans/zero-trust-services/)). The URL goes on a résumé only after publishing.

## Noted

- **N1. The card that expands into the piece**, built with [cross-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document). Its behavior under each framework is part of the bake-off (S2).
- **N2. The lorem-ipsum pieces:**
  1. An essay with the parade (Alice placeholders), the card transition, and the bake-off. It hosts the P2 themes.
  2. A write-up with diagrams, static and moving, on placeholder content.
  3. A heavy treatment with its own font, as the MDX test.

  All three test the stack and styling, not the prose.
- **N3. Essays:**
  1. *Too Loud a Solitude*, in the launch pair.
  2. After publishing: *Snow Crash* or *The King in Yellow*.
  3. *The Shadow of the Torturer*, which has no angle yet.
- **N4. Flash only where it makes sense.** A standing filter.
- **N5. The umbrella carousel** (first cut, S26). The write-up shows how sessions spin up and draw cards. The fan-out becomes a rotating 3D carousel: clicking a panel twists it forward and expands only that panel. The "Card Arm Flow" chart is a **visual reference only**. Its content doesn't ship, and its labels never enter the public repo, because it comes from a private test with personal details. The carousel's real content comes from the later contrived run (S12). `planning-handoff.md` records where the reference lives.
- **N6. The LinkedIn overhaul** is a dependency of the about page, not a site task.

---

## Open

No decisions are open.

### Watch
- Gmail's "Send as" change in January 2027 ([Gmail Help](https://support.google.com/mail/answer/22370)). Sources disagree on whether custom domains are covered ([Android Authority](https://www.androidauthority.com/gmail-killing-third-party-send-as-feature-3694659/), [ImprovMX](https://improvmx.com/guides/gmail-send-as-alternatives)). It no longer blocks the publish bar (S22). The fallback is in P4.

### Results due (outcomes, not decisions)
- the bake-off verdict (S2)
- the MDX verdict (S15)
- the winning theme and final style guide (P2)
- the hand-made first cast (S7), which gates rig automation (P3)
