# Where agent skills and instructions live, and how to add and evaluate them

Researched 2026-11-02. Installed Claude Code here: 2.1.291. Every web claim below was fetched this session; URLs in the source list. "Unverified" marks anything I could not confirm.

## Recommendation (one decision per question)

1. **Skill location: keep `.claude/skills/`, committed.** It is the only project path Claude Code documents for skills (S1). `.agents/skills` is not read by Claude Code (S1 never mentions it; S2 says nothing under `.agents/` is read for instructions; open request S9). Josh's repo is Claude Code only, so a shim buys nothing. If a second tool ever matters, make `.agents/skills/` canonical and symlink `.claude/skills` to it. Symlinking is my inference; S9's commenters describe doing this, and S1 does not bless it. Codex reads `.agents/skills` (S11).
2. **Instruction file: keep `CLAUDE.md` alone; do not add `AGENTS.md`.** Since v2.1.277 (2026-09-18) Claude Code reads `AGENTS.md` only when no `CLAUDE.md` exists in or above the working dir (S2, S10). Having both means `AGENTS.md` is ignored unless CLAUDE.md imports it with `@AGENTS.md`. CLAUDE.md is 2,421 bytes, far under the 200-line target (S2).
3. **Always-loaded cost: already small; one cheap trim.** 38 skills, 23 with `disable-model-invocation: true` (their descriptions are removed from context, S1). The 15 model-invocable ones carry 3,009 description characters (3,198 with names), longest 421, well under the 1,536 per-entry cap (S1). Whole set is 5,422 description characters. Listing budget is 1% of the context window (S1; unit not stated, so unverified whether chars or tokens), so it fits on a 1M window but could truncate on 200k. Set clearly irrelevant vendored skills (e.g. course scaffolding, test-typing migration, pre-commit setup) to `"off"` or `"name-only"` in `skillOverrides` instead of deleting: it is reversible and `skills-lock.json` stays truthful (S1). Run `/skill-doctor` first (v2.1.252+) to see which are never invoked.
4. **Adding skills: evidence first, one at a time.** Anthropic's order: run the task without the skill and write down the failures, write three scenarios for those gaps, record the baseline, write the minimum instructions, then rerun and compare (S4). Add a skill only if a baseline run fails in a way you can name.
5. **Cheapest valid evaluation (under an hour):** a paired baseline on 3 prompts. Use fresh sessions, one with the skill and one with it set to `"off"` in `skillOverrides` (S1, S5). Prompts are realistic user phrasing, not "use skill X". Grade with 3 to 5 checkable assertions per prompt; require concrete evidence for a pass (S5). Roughly 20 to 40 minutes. For a reviewer standard, seed a diff with 3 to 5 known defects and score catches with and without the standard; that exact design is my synthesis, but it follows S5's with/without pattern. Optional upgrade: `claude plugin eval` (needs v2.1.269+, installed 2.1.291 qualifies). It takes a plugin dir or a "skills-directory plugin", runs each case 3x with and 3x without, reports WITH, W/OUT and delta; the docs' one-case example cost $0.41 (S6). Use `--runs 1 --ablation none` for quick iteration, then confirm at 3 runs (S6). Unverified: whether this repo's `.claude/skills` counts as a skills-directory plugin without extra setup. Run `claude plugin eval init` to find out.
6. **Version-specific libraries (Astro 7, pnpm 12, Node 26): do not rely on a model-invoked skill alone.** The only hard evidence is one vendor's: Next.js 16 APIs outside training data scored 53% baseline, 53% with a skill (never invoked in 56% of cases), 79% with explicit "use the skill" wording, 100% with a compressed docs index in AGENTS.md (S7). So for must-always-apply facts, put a short index or pointer in always-loaded CLAUDE.md or a `paths`-scoped rule/skill (S1, S2). Keep skills for explicit workflows. This repo's CLAUDE.md already does this for pnpm (pointer to `docs/agents/pnpm.md`) and adds "check current docs". Keep that, plus a skill description that names the library versions.
7. **Context management:** keep CLAUDE.md under 200 lines and only facts Claude cannot derive from the code (S2, S8). Rules that admit no exceptions go in hooks, not CLAUDE.md (S8). Delegate verbose work (tests, docs fetches, log reading) to subagents. Put a skill's most important instructions first, because compaction keeps only the first 5,000 tokens of each invoked skill (S1).

## Local findings (this repo)

- `.claude/skills`: 38 skills, all in `skills-lock.json` from one upstream GitHub repo (`mattpocock/skills`). None are locally authored. 103 tracked files under `.claude/`. No `.agents/` dir. `.claude/worktrees/` is git-excluded.
- 23 `disable-model-invocation`: ask-matt, chief-of-staff, claude-handoff, grill-me, grill-with-docs, handoff, implement-spec, implement, improve-codebase-architecture, loop-me, retro, setup-matt-pocock-skills, setup-ts-deep-modules, teach, to-questionnaire, to-spec, to-tickets, triage, wait-what, wayfinder, writing-beats, writing-fragments, writing-shape.
- 15 model-invocable: code-review (421 chars), wizard (313), codebase-design (265), research (238), setup-pre-commit (238), git-guardrails-claude-code (243), scaffold-exercises (204), prototype (179), migrate-to-shoehorn (168), diagnosing-bugs (156), grilling (152), domain-modeling (151), tdd (149), writing-for-agents (103), pr (29).
- Observation: this session's own skill list shows each repo skill a second time under a `.claude/worktrees/template-sheet:` prefix, so worktree copies are being listed too. S1 says project skills also load from subdirectories. Worth checking `/context` for double cost. Unverified whether it counts against the budget.
- `writing-for-agents` (81 lines) already states the principles Anthropic's pages state: pointer wording decides triggering, always-loaded lines cost every turn, single source of truth, prune no-ops. Its "two loads" idea maps to S1's description budget. It does not mention evals or baselines. That is the gap S4 fills.
- Frontmatter in use: only `disable-model-invocation` and `argument-hint`.

## Differs from older assumptions

| Old assumption | Current truth | Source |
|---|---|---|
| `.agents/skills` is the cross-tool path Claude Code reads | Claude Code does not document or read it. Spec leaves location open; the client guide calls `.agents/skills` a widely adopted convention. Request open since 2025, #31005 updated 2026-10-28; reports say `npx skills add` installs there are invisible to Claude Code | S1, S3, S9, S12 |
| Claude Code ignores AGENTS.md | Reads it since v2.1.277 (2026-09-18), only when no CLAUDE.md is in or above the working dir. #6235 closed 2026-09-25. Not read: `AGENTS.local.md`, `AGENTS.override.md`, anything under `.agents/` | S2, S10 |
| AGENTS.md and CLAUDE.md can coexist and both load | Default is CLAUDE.md only. Both load only via `@AGENTS.md` import or the `claude-md-and-agents-md` setting | S2 |
| Skills load fully at startup | Name plus description listed each session; body loads on use. Entry capped at 1,536 chars (`description` + `when_to_use`); budget 1% of context window; least-used lose descriptions first | S1 |
| Description limit is 1,024 chars | 1,024 is the spec and API limit. Claude Code lists up to 1,536 and lets you tune it (`skillListingMaxDescChars`) | S1, S3, S4b |
| Hiding a skill from Claude still costs its description | `disable-model-invocation: true` removes the description from context; also blocks subagent preloading | S1 |
| Skills cannot be tested | Baseline with/without; `claude plugin eval` (v2.1.269+, 3 runs per arm, delta score, CI gate); skill-creator evals, benchmark, blind A/B, description tuning; `/skill-doctor` for cost and unused skills. The two eval formats are not interchangeable | S1, S5, S6, S13 |
| "There's no built-in way to run skill evals" | Best-practices page still says this; the Claude Code docs and S6 now supply one for Claude Code | S4, S6 |
| Models reliably invoke relevant skills | One vendor eval: skill never invoked in 56% of runs without explicit wording | S7 |
| Skills always help | Curated skills +16.2pp average but 16 of 84 tasks got worse, and software engineering gained least (+4.5pp); self-written skills -1.3pp (secondary summary, paper not fully read) | S14 |
| Skills last forever | Capability-uplift skills may become redundant as models improve; rerun the baseline after model updates | S13 |
| Manage context aggressively; subagents save context | Page now says 1M windows make running out rare. `/clear` between tasks and subagents for noisy or parallel work still help, but subagents cost extra tokens; a subagent's cache lasts 5 minutes | S8, S15 |
| Compaction drops invoked skills | It re-attaches the latest invocation of each skill: first 5,000 tokens each, 25,000 combined, newest first | S1 |
| CLAUDE.md can enforce rules | Context, not enforcement. Use hooks, deny rules or managed settings for zero-exception rules | S2, S8 |
| Plugins are only for sharing | An enabled plugin's invocable skills are in context every turn; the Official marketplace shows a context-cost estimate | S16 |

## Sources (all fetched 2026-11-02)

- S1 Claude Code skills: https://code.claude.com/docs/en/skills (118,821 chars; read in two parts)
- S2 Claude Code memory (CLAUDE.md, AGENTS.md, rules): https://code.claude.com/docs/en/memory
- S3 Agent Skills specification: https://agentskills.io/specification (no date shown)
- S4 Skill authoring best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- S4b Adding skills support (client guide, `.agents/skills` convention): https://agentskills.io/client-implementation/adding-skills-support
- S5 Evaluating skill output quality: https://agentskills.io/skill-creation/evaluating-skills
- S6 Test plugins with evals (`claude plugin eval`): https://code.claude.com/docs/en/plugin-evals
- S7 Vercel, AGENTS.md outperforms skills in our agent evals (2026-01-27, Jude Gao): https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals
- S8 Claude Code best practices: https://code.claude.com/docs/en/best-practices
- S9 Issue #31005, AGENTS.md and .agents/skills (open, updated 2026-10-28): https://github.com/anthropics/claude-code/issues/31005
- S10 Release v2.1.277 (2026-09-18): https://github.com/anthropics/claude-code/releases/tag/v2.1.277 (read via `gh api`); issue #6235 state read via `gh`
- S11 Codex skills (`.agents/skills`, no date shown): https://learn.chatgpt.com/docs/build-skills
- S12 vercel-labs/skills agent table (Claude Code uses `.claude/skills`; many tools use `.agents/skills`): https://github.com/vercel-labs/skills/blob/main/docs/agents.md
- S13 Anthropic, Improving skill-creator (2026-03-03): https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills
- S14 SkillsBench (arXiv 2602.12670; versions disagree on counts; figures from search summary, paper body not read): https://arxiv.org/html/2602.12670v1
- S15 Anthropic, Effective context engineering (2025-09-29): https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents ; Subagents: https://code.claude.com/docs/en/sub-agents ; Costs: https://code.claude.com/docs/en/costs
- S16 Plugins overview: https://code.claude.com/docs/en/plugins

Not fetched or unverified: the skill-creator plugin's own README (S1 and S13 describe it); whether Claude Code reads `.agents/skills` via any setting (no doc says so; S9 open); `skillListingBudgetFraction` unit and default beyond "1%".
