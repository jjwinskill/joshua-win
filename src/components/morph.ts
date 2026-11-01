// The view-transition names a card shares with its piece, so the two can't drift apart. The box is the
// card itself, which grows to fill the screen. Each piece of text has its own name and moves to its place
// on the page. The cast is only on the card, so it fades where it stands. The role comes first, so no slug
// can make one piece's name equal another's.
export function morphNames(slug: string) {
  return {
    box: `piece-box-${slug}`,
    kicker: `piece-kicker-${slug}`,
    title: `piece-title-${slug}`,
    dek: `piece-dek-${slug}`,
    cast: `piece-cast-${slug}`,
  };
}
