# Coding standards

Judgement calls for the code on this site. The **reviewer** enforces them, and anyone writing code should read them first. A rule a machine can check belongs in lint, a test or CI instead. Version-specific facts are in [`docs/agents/stack-traps.md`](docs/agents/stack-traps.md).

## How to review

- Report what would make the site wrong: a bug, a broken promise in the ticket, a missing test. Skip style and cleanup, since a reviewer who must find something will, and fixing it adds abstraction.
- Each finding gives a file and line, what goes wrong, and when.
- Read the test diff first. Flag a removed test, a weakened assertion, a lowered threshold, or a skipped check.
- Answer a defect with a fix, a follow-up issue, or a quote from the code, output or spec that disproves it. Doubt, or agents disagreeing, is no answer. A labeled judgement call can be declined in one line.
- Stop at three rounds on one PR. Anything still open goes on the PR as a follow-up, unless Josh accepts it.
- Findings and their answers go on the PR (G21).

## Tests

- A test earns its place by failing without the fix. For a bug fix or a race, remove the fix and watch the test fail, and say so on the PR. Run a timing-sensitive one about 25 times.
- Test what a reader gets: the page, its roles and text, the rendered position. Internals change.
- Wait on a condition (`waitForFunction`, web-first assertions), rather than a fixed sleep.
- A check on a value the platform measures, such as a font's height, allows for Linux and macOS differing.
- A moving part is sampled at its extremes, as well as at rest.

## Anything that moves

Go through every line below for any part that moves, against the code, and say on the PR or in a test how each one holds. Every one was a real bug in phase 3.

- **Screen sizes:** it starts and finishes on a phone, and on a screen too short to show all of it.
- **Input:** a mostly vertical swipe still scrolls the page. A canceled pointer, a second finger and a mouse that loses its button all leave it working. A slipped tap still counts as a tap.
- **Focus:** Tab can reach each control in every state, including folded or zero-sized ones, and the focus can be seen there.
- **Reduced motion:** it holds still, and switching it on mid-play stops the motion and leaves the content reachable.
- **Bounds:** nothing clips at its most extreme pose, and the longest label stays on screen at phone width.
- **Dark mode:** every color and edge holds up on a dark page.
- **The floor:** a reader who ignores the animation still gets the point. The visual is `aria-hidden`, with real text and real buttons beside it (S16).
- **Feel:** only Josh's phone can judge this, so a test passing says nothing about it.

## Site code

- Anything set up on a page survives the card transition and Back, and cleans up after itself on a page swap.
- Links go through `sitePath()`, so they stay under `/skill/`.
- This repo is public: no drafts, personal details or private test material. Cast photos go through `docs/cast/tools/convert-photo.py`.

## Agent files

- A fact an agent must always have goes behind a pointer in `CLAUDE.md`. A model-invoked skill alone is unreliable, so a skill suits a workflow that gets asked for (G49).
- Add a skill or a rule only after a baseline run fails in a way you can name, then rerun it to see the change. Rerun after a model change, and remove what no longer helps.

## Worktrees

A fresh worktree has no dependencies or generated types. Run these before anything else:

```bash
pnpm install --frozen-lockfile
```

```bash
pnpm exec astro sync
```

Start work from `origin/main`, because a local `main` is often behind. Remove the worktree and its local branch once its PR has merged.
