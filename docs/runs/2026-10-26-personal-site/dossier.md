# Idea dossier: the personal site's extra piece

## The choice: The Cast Call (the parade, per-piece treatments, a hand-made shell)
The person's own combination after four menus, in their words: "drawn characters in a parade/loading bar", "individual stylistic treatments of substance per essay/write-up", and "beautiful, contemporary design, with delightful visual features".

- **What it is:** each essay or write-up carries a small hand-drawn cast: up to four characters, objects or places from the work it discusses, usually a single book or film. As the reader passes each one's first mention, its character hops onto the reading-progress line at the bottom of the screen. At the end the cast gathers, bows from the hips and walks off like a curtain call. A still "cast, in order of appearance" list after the essay is the accessible, crawlable version, and each card links to that character's passage. The developer added two things: the cast becomes the essay's link-preview image, and the idle bobbing is dropped. Around this sit per-piece treatments (a piece may restyle anything inside its article area, with a reason, including bringing its own font) and a shell whose look comes from the drawings.
- **Why it fits:** it works from the first essay, it's built from each essay's own subject (media), it's the same component everywhere, and it's paced by the reader. It shows humor, taste, care and front-end craft without changing what the essays say. It asks nothing of the reader.
- **Distance from the obvious answer:** 3 for the parade (the filter's score for Progress Bar Parade). The round-3 obvious answers were "each essay laid out as the media it argues about" and "a diagram of the page's own wiring". The per-piece treatments are a scaled-down form of the first, and the shell is the floor any careful site needs.
- **What it would take:**
  - **Per essay:** about 2–4 hours to draw, photograph and vectorize three or four characters (the developer's estimate).
  - **Once:** a shared leg-and-bow rig and a `<Cite>`-style registry that maps each mention to a character.
  - **Building it:** the person plans to have an agent vectorize and rig the drawings; the strategy's pipeline is a photo, then [VTracer](https://github.com/visioncortex/vtracer) or [Potrace](https://potrace.sourceforge.net/) (Potrace needs a thresholded black-and-white bitmap, not a raw photo), then [SVGO](https://github.com/svg/svgo), then [SVGR](https://react-svgr.com/).
  - **Upkeep:** near zero. The working mechanism already exists as `demo/parade.html`.
- **Cheapest first test (within a week):** draw characters for one real draft, drop them into the demo, and send it to six people with "read this." Ask the next day what they remember. It passes if three or more mention the characters unprompted and nobody calls them distracting.
- **Biggest risk:** few people look at a progress bar. In [Viget's 2015 eye-tracking study](https://www.viget.com/articles/should-you-use-a-custom-scroll-indicator-a-study-with-eye-tracking/), 4 of 18 readers fixated on a custom scroll indicator while reading, and none did so twice (though 13 of 18 used it when asked how much was left). The adversary's version: the bar is keyed to scrolling, which is the flaw the person named in another idea. The design answer is to put the payoff in the drawings themselves (the preview image, the cast list, the curtain call) rather than in readers watching the bar. The person accepted this risk at Gate 2.
- **Prior art:** *known in principle, new in form*. For the web form, no prior art was found in reachable sources; Awwwards, CodePen, patent full text and personal blogs were not reached.
  - Nearest works: [Viget's custom scroll indicators](https://www.viget.com/articles/should-you-use-a-custom-scroll-indicator-a-study-with-eye-tracking/) (borderline close on function, distinct on reward); [Framer's Read Progress Line](https://www.framer.com/marketplace/components/read-progress-line/) component, with milestone markers and a confetti completion action (close on mechanism, distinct in form); the Super Mario RPG ending parade (distinct, since it isn't a progress meter).
  - Narrowest surviving claim: a reading-progress indicator whose marks are hand-drawn characters from the work being discussed, each arriving as the reader passes its first mention, ending in a curtain call.
  - Details and the hand searches still to do are in `rounds/priorart.md`.
- **Open premises (the adversary's "fatal unless" points, which the person set aside for now):**
  1. The drawings carry the wow as static art. Still unconfirmed: the person will draw them, but no drawing exists yet.
  2. An early piece has a real form tie-in. Their first write-up, on building the creative-iteration skill, with Mermaid charts, is a candidate.
  3. The shell is art-directed from the drawings, not from default polish.
  4. The adversary also flagged that one of these should own the motion budget, and that the technical write-ups and AI showcase aren't covered by the piece itself. The strategy session now handles both.

## Runners-up
### About page as a title sequence
The About page is a few type-only title cards, like a film's opening credits, carrying the person's humor and obsessions. The reader clicks or taps through, and the last card is the contact address. Distance 4. No such About page turned up (distinct, on a thin search). The person: "that's ok." It works with zero essays, and the cast could appear there too. Risk: a click-through About page can feel slow, so all the text stays in the page.

### Each essay wears its subject (as a per-piece device)
Where a piece has a real tie-in, its layout acts out what it argues. The person's own example is one column for the essay and one for an AI processing it, in an essay on whether AI "thinks". Distance 1, since it was a round-3 obvious answer. Too close (borderline) to [art-directed blogs](https://www.webdesignerdepot.com/2010/05/showcase-of-blogs-with-unique-post-designs/). It is now part 2 of the choice, as a device used only when it earns its place, not as a rule.

### One Broken Rule (as a per-piece device)
A strict typographic system that breaks exactly one rule where the argument turns. Distance 2. The person parked it, then called its variants "too subtle" and "too situational". It stays as a tool for a piece whose argument genuinely turns on form, which ties to their interest in prose and poetry that use visual layout.

### The cast as the link-preview image
The developer's addition, which also absorbs the tabled Text-Grown Covers idea. Each essay's share card is its cast, rendered to PNG or JPG, since link previews (LinkedIn included) reportedly don't accept SVG. It needs no glance at the progress bar to land, and it's the first thing an evaluator sees in a LinkedIn feed. Share-card generators are common (too close as a technique), so the cast art is what makes it distinct.

## Also on the shelf
See `vault.md` for every idea that didn't make it and what would bring it back. Notable entries:
- The person's own essay-specific ideas: a Clippy-style "buddy" for an essay on digital assistants, and a hidden "90's mode".
- The card-that-expands-into-the-piece transition for the home page, which the person flagged as an opportunity.
- Text-Grown Covers, if it finds a reason tied to reading.

## Handoff
This dossier is the brief for strategy and planning. Strategy is already under way in a separate session (`strategy/strategy.md`, `strategy/decisions.md`). The next build step there is three lorem-ipsum prototype pieces.
