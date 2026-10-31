// The parade: the cast gathers along the reading-progress line and ends in the curtain call. React only
// renders the structure; the controller moves it. No framework APIs, so the bake-off can reuse it in Next.
import { useEffect, useRef } from 'react';
import { CastFigure } from '../cast/CastFigure';
import { mentionId } from '../cast/mentions';
import { castRegistry, type CastKey } from '../cast/registry';
import { createParade, type ParadeController } from './controller';

interface ParadeProps {
  cast: readonly CastKey[];
  // The id of the element that starts the curtain call when the reader reaches it.
  endId: string;
}

export function Parade({ cast, endId }: ParadeProps) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const controller = useRef<ParadeController | null>(null);

  useEffect(() => {
    const end = document.getElementById(endId);
    if (!root.current || !stage.current || !fill.current || !end) return;
    const slots = [...stage.current.querySelectorAll<HTMLElement>('.slot')];
    const actors = cast.flatMap((key, i) => {
      const slot = slots[i];
      const art = slot?.querySelector<HTMLElement>('.art');
      const mention = document.getElementById(mentionId(key));
      return slot && art && mention ? [{ slot, art, mention }] : [];
    });
    const parade = createParade({
      root: root.current,
      stage: stage.current,
      fill: fill.current,
      actors,
      end,
    });
    controller.current = parade;
    return () => parade.destroy();
  }, [cast, endId]);

  return (
    <nav className="parade" ref={root} aria-label="Reading progress: this essay’s cast">
      <div className="stage" ref={stage}>
        <div className="track" aria-hidden="true" />
        <div className="fill" ref={fill} aria-hidden="true" />
        {cast.map((key, i) => (
          <button
            key={key}
            type="button"
            className="slot"
            aria-label={`${castRegistry[key].name}: jump to their first appearance`}
            onClick={() => controller.current?.jumpTo(i)}
          >
            <span className="hop">
              <span className="art">
                <CastFigure castKey={key} />
              </span>
            </span>
            <span className="dot" aria-hidden="true" />
            <span className="label" aria-hidden="true">
              {castRegistry[key].name}
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="replay" onClick={() => controller.current?.replay()}>
        Replay the curtain call
      </button>
    </nav>
  );
}
