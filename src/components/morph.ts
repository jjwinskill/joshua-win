// The view-transition names a card shares with its piece's header, so the two can't drift apart.
export function morphNames(slug: string) {
  return { box: `piece-${slug}`, title: `piece-title-${slug}` };
}
