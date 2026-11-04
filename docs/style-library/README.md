# Style library

The house styles from the style run (2026-11-02 to 2026-11-03), kept so their parts can be reused later. Two won and became the house style: **Soft Optical** for the essays and the site, and **Plum Hour** for the write-ups (G51 in `docs/plan.md`, added by #93). The rest are here because pieces of them may suit a later piece or treatment.

Each style's full token set is in `round-1.json` and `round-2.json`: fonts and fallbacks, type sizes, dark and light palettes (every pair passed WCAG AA, checked by code), corner radii, shadows, motion timings and easing, the focus ring, and its signature feature. Round 2's entries also spell out each feature's look, timing and reduced-motion behavior closely enough to build from. The `pitch` fields were written to Josh during the run.

Every style was built live, in dark and light, with its features and motion working, in two pages on Josh's claude.ai account (private unless he shares them):

- House Style Menu (round 1's ten): https://claude.ai/artifact/JdHghczuPmhavSZdmJF4Di
- House Style Round Two (round 2's six, then round 1's features): https://claude.ai/artifact/13xfz7K3rWkNNL79L92RyR

## Round 1

| # | Style | Font | Signature | Where it stands |
|---|---|---|---|---|
| 1 | Atomic Hearth | Bricolage Grotesque | One mint glow and an underline that draws itself in, on a warm brown-black page | Not picked. Josh liked the colors ("I like the colors here"), not the title font. Its mint went on to Moss Room. |
| 2 | Soft Optical | Fraunces | Softness and wonk only at display sizes, so titles have personality and paragraphs stay quiet | **Chosen** for the essays and the site. |
| 3 | Overprint | Bricolage Grotesque | Flat ink layers; pressing a card flattens its hard offset shadow into the page | **Parked** for one piece, or a special kind of write-up. Josh found its card shadows too bright, and the whole too much like a marketing page for an essay site. |
| 4 | Lamplight | Jost | Hover and focus raise a soft two-hue light behind the element | Not picked. |
| 5 | Streamline | Jost | One long ease-out curve for everything; cards lift as if on a rail | Not picked whole. Its Jost and pill shapes went into round 2. |
| 6 | One Line Spine | Figtree | A wobbly marker line down the margin, with headings as nodes | Out. Lines joining headings are vetoed: the parade already does that job. |
| 7 | Lamplight Dial | Jost | A three-stop warmth dial (night, dusk, day) in place of a theme toggle | Not picked. |
| 8 | One Line Worn In | Figtree | Followed links and read headings stay drawn, so the page shows where the reader has been | Not picked whole. Its purple page went into Plum Hour; its yellow didn't land. |
| 9 | Voice and Tooling | Recursive | A label's mono axis morphs to proportional on hover | Out. |
| 10 | Sorting Office | Jost | Hovering a term lights its other mentions, on a route drawn down the page | Not picked whole, though Josh liked it "quite a bit". The bright orange in dark mode "looks exactly like the color scheme for the browns", and he wanted rounder corners and a different focus ring. It grew into round 2's 3 and 6. |

## Round 2

Round 2 answered Josh's notes on round 1: Jost throughout, Streamline's rounder shapes, much less orange.

| # | Style | Signature | Where it stands |
|---|---|---|---|
| 1 | One Line Worn In, Teal | One teal marker line, slightly wobbly, under links, along rules and around focus | Not picked. The wobbly line went into the house style (under a piece's header, and the end mark). Josh wasn't a fan of its light version. |
| 2 | Plum Hour | Links grow a tinted pill behind them on hover | **Chosen** for the write-ups. |
| 3 | Sorting Office, Counter Green | Headings are stops on a route, each lighting green as it's passed | **Runner-up** for the write-ups. Its route joins headings, which is vetoed. |
| 4 | Cocoa Pillow | Cards are soft pads that sink on a press | Not picked, though liked, colors especially. Its motion range felt too large: "It reminds me of early 2000s Buttons that went way over the top". |
| 5 | Moss Room | A mint standby dot that swells on the current page's nav pill | Out for its dot; the palette is still good ("The color scheme for Moss Room is cool"). "the pulsing dot is visually distracting, especially because it's an indicator for an active state." |
| 6 | Soft Sorting Office | Each card's piece tint as a tab that slides out of a slot on hover | Not picked. Josh liked the tabs but doubts the site will have a use for them. |

## Reusing a part

Take the tokens from the JSON, not from the artifacts, and fit them to `src/styles/tokens.css`. A new color pair needs a contrast check, a moving part needs a reduced-motion version, and anything that joins headings with a line is still vetoed.
