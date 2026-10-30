# Adversary review of strategy v1

The three "fatal unless" premises from the dossier are set aside and not re-argued. Hour estimates below are mine, not measured.

## 1. Sequencing and scope (§8, §9, S22)
**Claim:** the plan doesn't fit the hours, and the real writing comes last.
**Why:** before a single real word ships, the plan builds: a component library, piece 1 twice (bake-off), a 10-style creative-iteration run, treatment research, three throwaway lorem pieces, a template sheet, a new rig skill, a 3D carousel, and email. My rough total is 100–150 hours, so about 15–30 weeks at 5–10 hours a week, and much longer at 2. The two essays that justify the site are the last items in the chain. Nothing says what gets cut if hours run short.
**Verdict:** fatal unless there is a cut list and an hours budget, with real writing started first.

## 2. Astro vs Next bake-off (§7, S2)
**Claim:** the bake-off buys little and costs a lot.
**Why:**
- Building piece 1 twice is likely 15–25 hours.
- This is a mostly static, text-first site with islands. I'd expect the metrics to differ little, but I haven't measured that.
- The test runs on lorem piece 1 before the parade, carousel or themes exist. The data will not predict the heavy pieces.
- The card-expand transition (N1) uses cross-document view transitions. I'm unsure how that behaves under Next's client-side routing, and browser support beyond Chromium needs checking. If it behaves differently, the bake-off is decided by something it doesn't measure.
- "A swap stays easy" is asserted, not tested.

**Verdict:** fatal unless it's timeboxed to about a day, with a pre-stated default and a stated reason. As written, a scar that grows.

## 3. The lorem-ipsum plan (§8, S4, N2)
**Claim:** the lorem pieces mostly produce throwaway work and misleading data.
**Why:**
- Treatments are "driven by the prose" (S3), and lorem has no prose. Piece 3, the heavy treatment, cannot be judged without an argument to serve.
- Piece 1 carries six jobs: bake-off, parade, rig, card transition, 10 theme variants, and MDX friction.
- The parade needs characters "from a cited work", which lorem lacks.
- All three pieces are deleted at publish (§9).
- S18 puts the lorem pieces on a live public site. §9 puts the site "at the top of the résumé". noindex does not stop a recruiter who has the URL. Hiring managers could land on lorem ipsum.

**Verdict:** fatal unless piece 1 is the real creative-iteration write-up draft, and the site isn't linked from a résumé until the lorem is gone.

## 4. Rig and art pipeline (§6, P3, P5)
**Claim:** the agent step is under-specified and the riskiest build item.
**Why:**
- The pipeline goes photo, trace, align, set pivots, SVGO, React. The dossier notes Potrace needs a thresholded bitmap, not a raw photo.
- Phone photos of pen drawings have skew, shadow and uneven lighting. Traced overlapping joints may show seams or hairlines when rotated.
- One shared pair of legs must look right under bodies of different proportions.
- The rig skill doesn't exist. It has no acceptance test beyond "looks hand-made", which is your judgement.
- The dossier's cheapest test (six readers, remembered unprompted) is not in the strategy.
- Drawing is 2–4 hours per essay. At 2 hours a week that is the whole week.

**Verdict:** fatal unless a manual fallback is defined first: hand-cleaned SVG parts and a hand-tuned walk for the first cast, with automation only after that works.

## 5. The 3D carousel (§7, S16, N5, O3)
**Claim:** a bespoke, expensive component with a missing source.
**Why:**
- Its model diagram ("Card Arm Flow", O3) has not been located.
- It needs CSS 3D, touch and keyboard handling, a reduced-motion state, and a duplicate hidden list.
- The aria-hidden visual beside live buttons may confuse screen-reader users: they reach controls whose effect they can't perceive. I'm unsure how this reads in practice, and it needs real screen-reader testing.
- It is optional for the write-up's argument.

**Verdict:** scar. Cut it first if hours slip. Static Mermaid is enough to ship.

## 6. Accessibility and performance claims (§1, S1)
**Claim:** the claims overreach.
**Why:**
- "Accessible because it's semantic" is necessary, not sufficient. axe finds only part of the problems (I'd say well under all of them). The bar has no manual screen-reader or keyboard pass.
- Scroll-driven, moving characters may raise WCAG 2.2 moving-content questions (such as pause, stop, hide). I'm unsure whether a short, scroll-paced walk is covered.
- "CWV good at the 75th percentile" is field data. A noindex, no-traffic site won't have it at launch. The enforceable version is lab only (Lighthouse CI), and the doc doesn't say so.
- Exempting lazy-loaded heavy JS from the first-load budget moves the cost into INP and CLS later, which the budget still names.

**Verdict:** scar, fixable by rewording the claims and adding a manual a11y step to the bar.

## 7. Email (§7, S10, O2, P4)
**Claim:** the bar is tied to an external policy change two months away.
**Why:**
- S22 requires "sending from @joshua.win working". Gmail's "Send as" for third-party addresses ends January 2027, and whether custom domains are covered is still unresolved (O2). Setting it up in November risks it breaking in January.
- Three third parties (Routing, Resend, Turnstile), DKIM/SPF merging and a Worker are a lot of setup for a job-search site. DMARC isn't mentioned.
- The fallback (a mail app via Resend SMTP) is acceptable, but it is a fallback to the bar item, not the plan.

**Verdict:** fatal unless the bar is changed to "inbound and contact form working", with replies from a mail client as the default.

## 8. The launch bar (§9, S22)
**Claim:** the bar can't be finished.
**Why:**
- It has 8 conditions, and several have no definition of done: "flair done", "feedback addressed", "style guide finalized".
- "Style guide finalized" depends on the P2 run, which depends on lorem piece 1.
- It gates indexing, but a job search is driven by direct links, not search, so the bar delays little that matters while holding back the link people would use.
- There is no date and no "ship anyway" rule.

**Verdict:** fatal unless trimmed and dated.

## 9. Other stall risks
- **Process overhead:** `grill`, `to-spec`, `to-tickets`, `implement`, `tdd` and `code-review` before any page exists. Scar.
- **AI-line `ask` rule on the content folder:** prompts on every lorem-content edit. Scar.
- **Public repo + private drafts (P6):** two-repo sync is one more chore. Scar.

## The single change before planning
1. Make piece 1 the real creative-iteration write-up. Drop the other two lorem pieces and the double-build.
2. Pick Astro by default (state the reason), with a one-day check against Next and no second build.
3. Cut the bar to: budget (lab), axe plus a manual keyboard/screen-reader pass, reduced motion, inbound email and form, and both pieces published. Add a ship date and a cut list in this order: carousel, rig automation, the 10-style run, per-piece fonts.
4. Treat replies from a mail app as the default, so O2 stops gating anything.
5. Don't put the URL on a résumé until the lorem is gone.
