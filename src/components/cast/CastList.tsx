// The cast list (S11): the still, accessible version of the parade. Each card is one link to that
// cast member's first mention, so it works with no JavaScript.
import { CastFigure } from './CastFigure';
import { mentionId } from './mentions';
import { castRegistry, type CastKey } from './registry';

interface CastListProps {
  cast: readonly CastKey[];
  citedWork: { title: string; author: string };
}

export function CastList({ cast, citedWork }: CastListProps) {
  return (
    <section className="cast-section" aria-labelledby="cast-heading">
      <h2 id="cast-heading">Cast, in order of appearance</h2>
      <p className="cast-sub">
        From <cite>{citedWork.title}</cite>, {citedWork.author}
      </p>
      <ol className="cast-list">
        {cast.map((key) => (
          <li key={key}>
            <a href={`#${mentionId(key)}`}>
              <CastFigure castKey={key} />
              <strong>{castRegistry[key].name}</strong>
              <span className="role">{castRegistry[key].role}</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
