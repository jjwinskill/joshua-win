# Planning hand-off

> Copied from the strategy folder on 2026-10-29 for the planning phase. Pointers to private material (session ids, transcripts, the private test behind Card Arm Flow) were removed for the public repo; nothing else changed.

This is the brief for the session that starts planning joshua.win/skill. Read the files in the order they're listed.

## Read first
1. [strategy.md](strategy.md) and [decisions.md](decisions.md): strategy v1, with 22 settled decisions and P1–P7.
2. [adversary-v1.md](adversary-v1.md): the attack on v1, plus the person's response once they've given one.
3. [../runs/2026-10-26-personal-site/dossier.md](../runs/2026-10-26-personal-site/dossier.md): the idea being built (the Cast Call). [vault.md](../runs/2026-10-26-personal-site/vault.md) holds the parked ideas.
4. [../demo/parade.html](../demo/parade.html): the working parade the person approved ("this is exactly what I was looking for"). Treat it as the spec for the rig's motion: the walk cycle, the hip bow, clickable dots with a peek on hover, and whole-card links in the cast list. **Its code-built legs are the shared legs for now.** The person draws bodies only.
5. [../research/visual-treatments.md](../research/visual-treatments.md): tabled until after lorem-ipsum piece 1 (S14).
6. Card Arm Flow, the model for the 3D umbrella carousel:
   - Where the reference lives is kept outside this public repo (it comes from a private test). **Reuse its shape only, never its labels.**
   - It shows the v0.10 pipeline. From v0.11 on, the cards reframe the problem and mutate the top seeds.
   - **It's a visual reference only.** None of its content ships. The real chart content will come from a future contrived run, probably on creative-iteration v1, done before the write-up is published. Until then the charts use placeholder content. What planning should work out is the visual representation of the skill's steps and orchestration.

## How the person wants planning to run (verbatim)
> "we use the strategy doc as an initial resource doc for the planning agent. The planning agent should create a new repo and folder on my compy, and we should install pocock's skills and creative-iteration, and run /grill-with-docs to get the party started (by party I mean planning phase). During the plan we'll have a creative-iteration phase for the style treatment, after our lorem ipsums are in place. We won't worry about providing content for the creative-iteration write up until our styling is nailed down, with the exception that I'd like to see visual treatments for each of the mermaid charts/flow charts I've alluded to. Then our plan will include a step creating those lorem ipsums, those don't need to be created during the planning phase. If it makes more sense, I'm also down to have an implementation phase 1 that includes initial iteration on the lorem ipsums and non-production pieces, our planning can break our actual implementation up in pieces so that the final piece of the implementation that the plan plans will be meeting the bar and shipping (read: publishing and indexing, since we'll want to have our CI/CD in place already)."

Suggested phase shape (the lead's suggestion, open to the grill):
1. **Planning:** `/grill-with-docs`.
2. **Implementation 1:**
   - repo, CI/CD deploying to Cloudflare with noindex
   - the three lorem ipsums and the Astro vs Next bake-off
   - the template sheet for bodies (P5)
   - the rig (P3), hand-made first and automated later
   - a visual treatment for each chart the person has mentioned, with placeholder content
   - the bake-off, timeboxed to about a day
3. **Style:** a creative-iteration run on piece 1, producing themes and then the style guide (P2).
4. **Content:** the person writes the two launch pieces. Agents help only when asked (the AI line).
5. **Ship:**
   - meet the launch bar
   - remove the lorem ipsums
   - lift noindex
   - after this, the site is "published"

## Setup notes
- **Repo:** it's public (settled). Name and folder are still to ask; the lead suggested `~/Documents/dev/joshua-win`.
- **Pocock's skills:** `npx skills add mattpocock/skills`, or `--skill grill-with-docs` for that one alone. Check the repo's README for the current command. As of July 2026 its flow is `/grill-with-docs` → `/to-spec` → `/to-tickets`.
- **creative-iteration:** already installed for the user at `~/.claude/skills/creative-iteration`, so the repo can use it without a copy. Copying it into a public repo would publish it, so ask before vendoring it.
- **Drafts stay out of the public repo** until they're published (P6).

## Charts the person has mentioned (for the treatment step)
- How each session spins up.
- How sessions draw individual cards, fanned out like Card Arm Flow. The person's verbatim note is in decisions.md, S-entry for diagrams: it's a 3D umbrella carousel, where clicking rotates a panel to the front and expands only that one.
- Ask the person for the rest. They've "alluded to" more Mermaid charts for the creative-iteration write-up.

## The attack on v1
The adversary's picks are folded into v1. Read decisions.md for:
- the cut list, in order: the carousel, rig automation, the 10-style run, per-piece fonts
- a definition of done for each item on the bar

The attack's 100–150 hour estimate doesn't matter here; see "Time and shipping" below.

## Time and shipping
There's no hours budget. The person: "this is a labor of love and if it takes longer it takes longer. Again, the bar is what we care about. We don't really care about time until I start just getting frustrated because there's been too much work and too little substance. That will give us some signal that maybe it's time to publish." Their motto is "just ship it". When that frustration shows up, apply the cut list (S26) and ship. Watch for it, and say so when you see it.

## Sessions and records to consult (only when the docs don't answer)

Private session, transcript and run-folder pointers are kept outside this public repo.

## Launch set
The creative-iteration write-up and the *Too Loud a Solitude* essay. The second essay (*Snow Crash* or *The King in Yellow*) is undecided and comes after launch.
