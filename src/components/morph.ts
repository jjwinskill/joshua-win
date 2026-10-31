// The view-transition names a card shares with its piece's header, so the two can't drift apart. Each
// piece of text has its own name and moves to its place on the page. What's only on one side, like the
// card's cast or the essay's date, stays in the box's snapshot and fades. The role comes first, so no
// slug can make one piece's name equal another's.
export function morphNames(slug: string) {
  return {
    box: `piece-box-${slug}`,
    kicker: `piece-kicker-${slug}`,
    title: `piece-title-${slug}`,
    dek: `piece-dek-${slug}`,
  };
}
