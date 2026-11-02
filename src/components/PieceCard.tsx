// A big card on the home page: one link that expands into its piece. The card and the essay page share
// view-transition names built from the slug, and the browser morphs one into the other.
import { morphNames } from './morph';
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
  const names = morphNames(slug);
  return (
    <a className="piece-card" href={href} data-morph style={{ viewTransitionName: names.box }}>
      <p className="kicker" data-morph style={{ viewTransitionName: names.kicker }}>
        {kicker}
      </p>
      <h2 data-morph style={{ viewTransitionName: names.title }}>
        {title}
      </h2>
      <p className="dek" data-morph style={{ viewTransitionName: names.dek }}>
        {dek}
      </p>
      {cast.length > 0 && (
        <span className="piece-card-cast" data-morph style={{ viewTransitionName: names.cast }}>
          {cast.map((key) => (
            <CastFigure key={key} castKey={key} />
          ))}
        </span>
      )}
    </a>
  );
}
