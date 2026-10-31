// A WebGL figure. It loads three.js only when it's near the viewport, renders only while on screen, and
// holds a still frame under reduced motion (S16). No framework APIs, so the bake-off can reuse it in Next.
import { useEffect, useRef, useState } from 'react';
import type { SceneRenderer } from './sceneRenderer';
import { useNearViewport } from './useNearViewport';

export function HeavyScene() {
  const { ref: figure, near } = useNearViewport<HTMLElement>();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const pausedNow = useRef(false);
  const sync = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!near || !canvas.current) return;
    const element = canvas.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let renderer: SceneRenderer | null = null;
    let onScreen = false;
    let cancelled = false;

    const run = () => {
      if (!renderer) return;
      const moving = onScreen && !pausedNow.current && !motion.matches;
      element.dataset.running = String(moving);
      if (moving) renderer.start();
      else renderer.stop();
    };
    sync.current = run;

    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
      run();
    });
    visibility.observe(element);

    void import('./sceneRenderer')
      .then(({ createSceneRenderer }) => {
        if (cancelled) return;
        renderer = createSceneRenderer(element);
        renderer.drawStill();
        element.dataset.loaded = 'true';
        run();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      visibility.disconnect();
      renderer?.destroy();
    };
  }, [near]);

  const togglePause = () => {
    pausedNow.current = !pausedNow.current;
    setPaused(pausedNow.current);
    sync.current();
  };

  return (
    <figure className="heavy-figure" ref={figure}>
      <div className="heavy-scene">
        <canvas ref={canvas} aria-hidden="true" />
        {failed && <p className="heavy-failed">This figure needs WebGL.</p>}
      </div>
      <p className="visually-hidden">A knot turning slowly, with six small shapes circling it.</p>
      <figcaption>
        Lorem ipsum dolor sit amet.
        <button type="button" className="heavy-pause" onClick={togglePause}>
          {paused ? 'Play' : 'Pause'}
        </button>
      </figcaption>
    </figure>
  );
}
