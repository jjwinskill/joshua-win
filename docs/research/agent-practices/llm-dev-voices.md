# What practitioners recommend for LLM-agent development (as of 2026-11-02)

Method: pages fetched this session (the tool summarizes pages, so detail is second-hand). Source numbers [n] are listed at the end.
Snippet-only or secondary material is flagged. Anthropic pages are also product pages.

Repo baseline (read-only): CLAUDE.md is 40 lines of pointers. Skills in use: retro, code-review (Standards + Spec in
fresh sub-agents plus a Fowler smell baseline), tdd, grilling, writing-for-agents, pr. GLOSSARY.md and ADRs exist.
`.claude/settings.json` holds only `ask` rules on prose paths. No hooks, no pre-commit, no CODING_STANDARDS.md,
no REVIEW.md, no .worktreeinclude. CI has ci.yml and checkpoint.yml. Memory already has an independent PR review rule.

## Worth adopting here (ranked; only things the repo does not already do)

1. Wire the existing checks into a hook so they are enforced, not requested.
   - Claude Code docs: a CLAUDE.md line works "most of the time, not every time". A Stop hook that runs the
     typecheck and exits 2 blocks the turn until it passes. A PostToolUse hook can run prettier [5].
   - Geoffrey Huntley: a pre-commit hook that fails the commit and injects a corrective prompt got his agent
     compliant "ten out of ten", where editing AGENTS.md left a gap that drifts [3].
   - Addy Osmani: prose is weak for hard constraints; encode them as a test, hook or permission [8].
   - Why here: retro says to build checks for mechanical rules, yet nothing is wired locally though `pnpm lint`,
     `typecheck` and `format:check` exist. Keep the enforced set small [5].
2. Give the reviewer something to enforce: a short standards/REVIEW file.
   - Claude Code team (Osmani, Lunt, Wang): code owners write a REVIEW.md that is short, says what failure looks
     like, caps nits, lists paths to skip, and requires file-and-line evidence [6].
   - The repo's code-review skill treats documented standards as its Standards axis, but there are none. It falls back
     to the smell baseline only. A short file of judgement calls (cross-file consistency, motion and cast conventions)
     would give the Standards agent real input. Mechanical rules still belong in lint, per the retro skill.
   - Claude Code docs: tell the reviewer to "skip style" or it will always find something, and fixing every finding
     adds needless abstraction [5]. Claude Code team: cap review rounds at three; drop style and cleanup findings [6].
3. Front-end: a separate, skeptical evaluator with written criteria, driven against the running page.
   - Anthropic harness post (Mar 24, 2026): agents "reliably skew positive" grading their own work. A standalone
     evaluator used Playwright, and its prompt needed repeated tuning against human judgment. Design was made gradable
     with four criteria (design quality, originality, craft, functionality), few-shot score examples included [2].
   - Anthropic Applied AI (Nov 2025): put design guidance in a skill so it loads only for front-end work. Targeted
     style rules breed new defaults, so ask for variation [4].
   - Simon Willison: have the agent screenshot the UI and review the images with its own vision [9].
   - Why here: Playwright is already configured. What is missing is a rubric for "does this feel right" (motion, parade
     character, per-piece treatment). Josh's phone check stays the final gate, since agents cannot judge feel.
   - That full harness cost roughly 20x a solo run [2]; use it only for treatment-heavy pieces.
4. Require evidence, and read test changes first.
   - Osmani: refuse PRs without purpose, test output and proof the tests ran. Agents can rewrite assertions to match
     broken behavior, so read the test diff before the code. Flag removed tests, skipped lint, lowered thresholds [10].
   - Willison: "Don't file pull requests with code you haven't reviewed yourself" [9]. Claude Code docs: "All tests pass"
     alone tells you little; ask for the command and its output, or the screenshot [5].
   - Why here: Lighthouse budgets exist. A CI check that a PR does not lower `lighthouserc` thresholds or delete tests
     is mechanical, so it belongs in CI, not prose.
5. Audit steering files on a cadence, and after each model change.
   - Osmani (Aug 27, 2026): files grow because rules are added and never removed. Run `/doctor`, remove what it
     flags, then test a real task without local skills [11]. Claude Code docs add `/doctor prompt-audit` [5].
   - Theo (secondary summary): prompts "decay silently" with each model upgrade [13].
   - Why here: CLAUDE.md is small, but docs/agents/*, skills and memory are not audited. Add it to retro.
6. Make sure skills actually fire; keep must-always-know facts out of skills.
   - Vercel (Jan 27, 2026, Jude Gao): in 56% of eval cases the skill was never invoked. A compressed always-loaded
     AGENTS.md index scored 100% against 79% for skills with explicit instructions [12]. Narrow Next.js eval, vendor post.
   - Theo (secondary): write skill descriptions as trigger keywords, not summaries [13].
   - Why here: always-needed facts are already in CLAUDE.md pointers. Check `code-review` triggers as intended.
7. Cap parallel work by review capacity and prep worktrees.
   - Osmani: the human is the bottleneck; his ceiling is 3 to 4 threads, and "watch your review quality, not your
     agent count" [14]. Orchestration tax post (May 24, 2026) gives the same case [15].
   - Claude Code docs: a worktree has no `.env` or `node_modules`; list needed files in `.worktreeinclude` [5].
     The repo has `.claude/worktrees` but no `.worktreeinclude`.
8. Lower: terse test output. Anthropic's compiler team had tests print a few lines and log the rest to files with
   grep-able error tags [7]. Check the Playwright and Lighthouse reporters.
9. Lower: a second reviewer built differently (Osmani: in one test of four tools, 93.4% of flags came from exactly one
   tool [10]). The repo's fresh-context review is one model family. Optional; costs more.
## Disagreements

- Steering files help or not. Anthropic docs say keep CLAUDE.md short and put exceptionless rules in hooks [5].
  An arXiv study (Feb 2026, Gloaguen et al.) found LLM-generated context files hurt in 5 of 8 settings and
  developer-written ones helped about 4% [16]. Vercel found an always-loaded index beat skills [12]. Pocock builds a
  skills catalog [1][17]. Theo (secondary) resists the skills ecosystem and distrusts memory features [13]. Each tested
  different things; none is a general answer.
- TDD. Willison: "Use red/green TDD" [9]. Pocock (Pragmatic Engineer, Sep 17, 2026; page summary, not transcript)
  has mixed feelings: agents have long context, so he asks for proof the code works, with or without TDD [17].
- Reading every line. Willison: eyeballing every line "has never been the most effective way" to validate [18].
  Karpathy still inspects diffs and wants clean, maintainable code [19]. Osmani: a human owns the merge [10].
  Anthropic: humans review intent, not every line, and agent approvals never count as the human approval [6][20].
- Sub-agents. Willison: fresh contexts preserve the parent's context [21]. Claude Code docs: protecting context is
  an old habit now, and delegating does not improve answers, though a fresh reviewer helps [5]. Theo (secondary):
  delegate only for breadth or adversarial review [13].
- Context management. Pocock's "smart zone / dumb zone" splitting (thresholds vary by source; I only have secondary
  reports) against docs saying running out of context is rare, though `/clear` between tasks still pays [5][17].
- Parallelism. Anthropic ran many parallel Claudes on a compiler, but they collided until the work was split by
  file [7]. Osmani caps humans at 3 to 4 threads [14]. Pocock is moving to cloud agents so work continues unattended [17].
## Hype to skip (for a one-person content site)

- Anthropic's seven-layer review stack, verifier voting and risk classifiers: built for 30,000+ merges a day [6][20].
  Borrow the shape (fresh-context pre-PR review, required CI, human on risky paths), not the machinery.
- Multi-agent harnesses at 20x cost [2]; Anthropic dropped parts as models improved.
- Mutation testing, property tests (Osmani [10][22]). Poor fit for visual and motion work.
- ALL CAPS emphasis, "think hard", "loop until done": the docs list these as obsolete [5].
- LLM-generated AGENTS.md or CLAUDE.md [16]; large imported skill libraries (Theo, secondary [13]); extra MCP servers.
- Auto-memory features (Theo, secondary: he disabled Claude Code's memory) [13].
- Claims that Karpathy "hasn't coded since December" and Osmani's agent-skills repo: only aggregator coverage; unverified.
- Benchmarks (Karpathy is skeptical [19]). His lens, verifiability [19][23]: agents are strongest where a pass/fail
  signal exists, which argues for investing in checks over prose.
## Coverage gaps

- Theo: no transcripts or t3.gg pages reached; only BigGo Finance summaries (Jun 3 and Aug 11, 2026).
- Fireship: only a rosetta.to list of titles and blurbs (2026); no guidance on skills, review or steering, so none drawn.
- Kent C. Dodds: search snippets only; nothing relied on.
- Pocock: aihero.dev articles 404'd; used the README, the catalog page and the Pragmatic Engineer episode page.
## Sources (all fetched via WebFetch this session unless marked)

1. Pocock, github.com/mattpocock/skills (README; no dates shown)
2. Anthropic, Harness design for long-running apps, 2026-03-24: https://www.anthropic.com/engineering/harness-design-long-running-apps
3. Huntley via Willison, 2026-10-13: https://simonwillison.net/2026/Oct/13/geoffrey-huntley/
4. Anthropic Applied AI, 2025-11-12: https://claude.com/resources/articles/improving-frontend-design-through-skills
5. Claude Code docs, Best practices (undated): https://code.claude.com/docs/en/best-practices
6. Osmani, Lunt, Wang, How the Claude Code team does code review (2026-10-15/16): https://claude.dev/blog/solving-code-review-at-anthropic/
7. Anthropic, Building a C compiler with parallel Claudes (2026-02-05): https://www.anthropic.com/engineering/building-c-compiler
8. Osmani, Agentic code quality, 2026-08-08: https://addyosmani.com/blog/agentic-code-quality/
9. Willison, Agentic Engineering Patterns (2026-02 onward): https://simonwillison.net/guides/agentic-engineering-patterns/ (chapters: red-green-tdd, agentic-manual-testing, anti-patterns)
10. Osmani, Agentic code review, 2026-06-15: https://addyosmani.com/blog/agentic-code-review/
11. Osmani, Audit your agent files, 2026-08-27: https://addyosmani.com/blog/audit-your-agent-files/
12. Vercel, AGENTS.md outperforms skills, 2026-01-27: https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals
13. Theo via BigGo (secondary): https://finance.biggo.com/news/63e17fcb23548c16 (2026-08-11); https://finance.biggo.com/news/5320d310d8ec014d (2026-06-03)
14. Osmani, Your parallel agent limit, 2026-04-07: https://addyosmani.com/blog/cognitive-parallel-agents/
15. Osmani, The orchestration tax, 2026-05-24: https://addyosmani.com/blog/orchestration-tax/
16. Gloaguen et al., Evaluating AGENTS.md, 2026-02 (search snippet only): https://arxiv.org/pdf/2602.11988
17. Pocock on Pragmatic Engineer, 2026-09-17 (page summary): https://newsletter.pragmaticengineer.com/p/ai-skills-with-matt-pocock
18. Willison, 2026-08-22: https://simonwillison.net/2026/Aug/22/more-than-just-code-review/
19. Karpathy, Sequoia Ascent 2026 summary, 2026-04-30: https://karpathy.bearblog.dev/sequoia-ascent-2026/ ; Year in review 2025: https://karpathy.bearblog.dev/year-in-review-2025/
20. Anthropic, Redesigning source control, 2026-10-13: https://www.anthropic.com/engineering/redesigning-source-control
21. Willison, Subagents chapter: https://simonwillison.net/guides/agentic-engineering-patterns/subagents/
22. Boris Cherny via Willison, 2026-09-11: https://simonwillison.net/2026/Sep/11/boris-cherny/
23. Karpathy, Verifiability, 2025-11-17: https://karpathy.bearblog.dev/verifiability/
Also read: Anthropic Agent Skills (2025-10-16), context engineering (2025-09-29), evals (2026-01-09); Osmani Agent Skills (2026-05-03).
