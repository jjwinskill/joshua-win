# Do the standards and stack traps change what agents do?

Phase 3.5, run 2026-11-02 by an agent, in under an hour. Sonnet ran every arm. These are small samples, mostly one run per arm, so read them as direction rather than measurement.

## Results

### Reviewer: `CODING_STANDARDS.md`, with and without

Fresh agents reviewed real commits, scored against the defects a later review or CI found. `h2` and `h3` count as out of sample in that the standards weren't written from those PRs, though each borrows a few general rules from them.

| Commit | Known defects | Without | With standards |
|---|---:|---:|---:|
| `r1`: #72's first commit | 3 | 2 | 1, then 2 after rewording |
| `r2`: #72's drag code | 5 | 2 | 4 |
| `h2`: #71 | 4 | 4 | 4 |
| `h3`: #68 (revised standards) | 4 | 0 to 1 | 2 |

- **It helps, at about the same noise.** Each arm reported 7 to 10 findings, and the standards put the real ones first: `r2` opened with three real bugs, where the baseline opened with mismatched arms.
- **`r1` and `r2` are partly in sample,** since the checklist was written from those bugs. `h3` is the fairest test, and there the baseline missed a height-only resize stretching the canvas, which the revised standards caught.
- **Nobody found** the clock running backward (CI did), or that printing lost the Swirl's text.
- **It also found real bugs nobody had recorded,** such as `r1`'s reduced motion being read only once.

Round 2 changed the wording after `r1` missed the zero-sized focus target. "Go through every line" and naming folded and zero-sized controls caught it on the rerun. Lines the agents would do anyway were cut.

### Stack traps: nothing, a skill, or a `CLAUDE.md` pointer

| Tasks | Assertions | None | Skill | Pointer |
|---|---:|---:|---:|---:|
| Collection, React island, page script and plugin | 16 | 15 | 16 | 16 |
| React Compiler setup (two runs per arm) | 2 | 0 | 2 | 2 |

- **Where the repo has an example, agents copy it and get it right,** with or without guidance. Zod 4, `ref` as a prop, Sätteri and `entry.id` all passed unaided.
- **Where it has none, training data shows.** Both baseline runs set up the Compiler wrongly, one with the removed `babel` option. All four guided runs wrote `compiler: true`. Stack traps earns its place on exactly what Josh predicted: what's newer than the training data and absent from the code.
- **Other traps didn't discriminate.** No run in any arm used `_headers` or an unsafe skip on the required check, because `worker/` and `local-dev.md` already show the way.

## Decisions

- Keep `CODING_STANDARDS.md`, as revised, with four lines cut.
- Keep the `CLAUDE.md` pointer to `stack-traps.md`, and add no skill. They tied here, but this test can't separate them: the prompt listed the skill by hand, which is kinder than real invocation. Vercel's Next.js evaluation found skills not invoked in 56% of runs, and a pointer has no such risk.
- Keep `stack-traps.md` focused on what the repo doesn't show. Rows the code already teaches can go as the file grows.
- Add a push hook (`.claude/hooks/check-before-push.sh`). This phase had one failure a machine could stop: an agent pushed with lint failing. The script was tested by hand, on a clean and a broken tree. It hasn't been seen firing inside a session, because hooks load at session start.
- Add nothing else. Research suggested more, such as a Stop hook, an evaluator with a rubric, a threshold-lowering check and Dependabot, but no run failed for want of them.

## Limits

- `claude -p` couldn't sign in from inside the session, so subagents stood in for fresh sessions. `CLAUDE.md` wasn't really always-loaded: each prompt told the agent to read it. So real skill triggering and `claude plugin eval` are untested.
- One agent scored the runs, by assertions and by reading, and it also wrote the standards.
- Theo and Fireship could only be reached secondhand or by title, so they shaped nothing here. See `llm-dev-voices.md`.

## To repeat this

Run it after a model change, or before adding guidance.

1. Make a detached worktree per arm, under a scratch folder. Remove the guidance from the baseline's copy.
2. **Reviewer:** take a commit from before its review, and the defects found later. Ask a fresh agent to review `git diff`, adding only "read the standards first" to the guided arm. Score on the known list, and count the findings as noise. Hold out a PR the standards weren't written from.
3. **Coding:** pick a task with no example in the repo, where the correct answer is newer than the model. Tasks the code already teaches prove nothing. Write the assertions first, and grep for them.
4. Change one thing where a run failed, and rerun that arm.
