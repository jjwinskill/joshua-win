// A cheap prototype (#56): the orchestrator pits ideas against each other, down to the menu, as a pixel-art
// battle. It runs on time, so it starts when seen, stops off screen and has a real pause button. Before it
// starts, and under reduced motion, it's its still state: the menu. Under reduced motion a button snaps
// between the rounds instead. The drawing is in src/lib/battle.ts, and the art is placeholder.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import '../../styles/battle.css';
import {
  battleFrame,
  battleHeight,
  battleScript,
  battleWidth,
  nextStop,
  ticksPerSecond,
} from '../../lib/battle';
import type { Run } from '../../lib/run';
import { runCharts } from '../../lib/run-mermaid';

const reducedMotion = '(prefers-reduced-motion: reduce)';

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(reducedMotion);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const prefersReducedMotion = () => window.matchMedia(reducedMotion).matches;

export function PixelBattle({ run }: { run: Run }) {
  const script = useMemo(() => battleScript(run), [run]);
  const list = useMemo(
    () => runCharts(run).find(({ id }) => id === 'narrowing')?.list ?? [],
    [run],
  );
  const figure = useRef<HTMLElement>(null);
  const reduced = useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => false);
  const [tick, setTick] = useState(script.total);
  const [playing, setPlaying] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const finished = tick >= script.total;
  const running = playing && onScreen && !finished;

  // The first sight of it starts it. Scrolling away only pauses it.
  useEffect(() => {
    const element = figure.current;
    if (!element) return;
    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const seen = entry?.isIntersecting ?? false;
        setOnScreen(seen);
        if (seen && !started) {
          started = true;
          if (!prefersReducedMotion()) {
            setTick(0);
            setPlaying(true);
          }
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTick((current) => current + 1);
    }, 1000 / ticksPerSecond);
    return () => clearInterval(timer);
  }, [running]);

  const frame = useMemo(() => battleFrame(script, tick), [script, tick]);

  const toggle = () => {
    if (finished) setTick(0);
    setPlaying(finished || !playing);
  };
  const step = () => {
    setPlaying(false);
    setTick(nextStop(script, tick));
  };

  const playLabel = finished ? 'Play again' : playing ? 'Pause' : 'Play';
  return (
    <figure className="battle-chart" ref={figure}>
      <svg
        className="battle-screen"
        viewBox={`0 0 ${battleWidth} ${battleHeight}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {frame.map(({ key, fill, d }) => (
          <path key={key} fill={fill} d={d} />
        ))}
      </svg>
      <div className="battle-controls">
        {!reduced && (
          <button type="button" onClick={toggle}>
            {playLabel}
          </button>
        )}
        <button type="button" onClick={step}>
          {finished ? 'Start over' : 'Next round'}
        </button>
      </div>
      <figcaption>
        The battle: {run.orchestrator} pits the ideas against each other, round by round, down to
        the menu.
      </figcaption>
      <ol className="visually-hidden">
        {list.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </figure>
  );
}
