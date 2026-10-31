// The view-transition names a card shares with its piece's header, so the two can't drift apart. Each
// piece of text has its own name and moves to its place on the page. What's only on one side, like the
// card's cast or the essay's date, stays in the box's snapshot and fades.
export function morphNames(slug: string) {
  return {
    box: `piece-${slug}`,
    kicker: `piece-kicker-${slug}`,
    title: `piece-title-${slug}`,
    dek: `piece-dek-${slug}`,
  };
}
