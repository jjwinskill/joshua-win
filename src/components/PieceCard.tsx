// A big card on the home page: one link that expands into its piece. The card and the essay's header
// share view-transition names built from the slug, and the browser morphs one into the other.
import { CastFigure } from './cast/CastFigure';
import type { CastKey } from './cast/registry';

interface PieceCardProps {
  href: string;
  slug: string;
  kicker: string;
  title: string;
  dek: string;
  cast: readonly CastKey[];
}

export function PieceCard({ href, slug, kicker, title, dek, cast }: PieceCardProps) {
  return (
    <a className="piece-card" href={href} style={{ viewTransitionName: `piece-${slug}` }}>
      <p className="kicker">{kicker}</p>
      <h2 style={{ viewTransitionName: `piece-title-${slug}` }}>{title}</h2>
      <p className="dek">{dek}</p>
      <span className="piece-card-cast">
        {cast.map((key) => (
          <CastFigure key={key} castKey={key} />
        ))}
      </span>
    </a>
  );
}
