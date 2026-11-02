// A cheap prototype (#54, N5): the fan-out as an umbrella. Clicking a panel twists it forward and expands
// only that one. The real buttons sit outside the `aria-hidden` visual, placed over its panels (S16). Under
// reduced motion it snaps. It's first on the cut list (S26).
//
// A small spring drives it, writing transforms straight to the panels, because each panel's twist depends
// on where it is on the ring. Plain transitions would spin a panel the long way when it passes the back.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import '../../styles/umbrella.css';
import type { Run } from '../../lib/run';
import { agentLabel, runCharts } from '../../lib/run-mermaid';
import { nearestTurn, panelPose, type PanelPose } from './umbrella-pose';

const hub = { x: 50, y: 6 };
const stiffness = 170;
const damping = 15;

function panelTransform({ x, y, scale, twist }: PanelPose, swing: number): string {
  return `translate(calc(${x}cqi - 50%), ${y}cqi) perspective(60cqi) rotateY(${twist}deg) rotate(${swing}deg) scale(${scale})`;
}

const dots = (count: number) => '•'.repeat(Math.min(count, 12));

export function UmbrellaCarousel({ run }: { run: Run }) {
  const { stages } = run;
  const count = stages.length;
  const list = useMemo(() => {
    const lines = runCharts(run).find(({ id }) => id === 'fan-out')?.list ?? [];
    // The panels also say how many cards are left, so the list must too.
    return lines.map((line, i) => {
      const cards = run.stages[i]?.cards;
      return `${line} ${cards === 1 ? '1 card' : `${cards} cards`} left after it.`;
    });
  }, [run]);
  const [selected, setSelected] = useState(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const ribs = useRef<(SVGLineElement | null)[]>([]);
  const canopy = useRef<SVGPolygonElement>(null);
  const turn = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    const draw = () => {
      const poses = stages.map((_, i) => panelPose(i, turn.current, count));
      // Panels hang from the rim, so they swing out as it turns.
      const swing = Math.max(-14, Math.min(14, velocity.current * -5));
      poses.forEach((pose, i) => {
        const panel = panels.current[i];
        const button = buttons.current[i];
        const rib = ribs.current[i];
        const transform = panelTransform(pose, swing * (1 - pose.open));
        if (panel) {
          panel.style.transform = transform;
          panel.style.zIndex = String(pose.depth);
          panel.style.setProperty('--open', pose.open.toFixed(3));
        }
        if (button) {
          button.style.transform = transform;
          button.style.zIndex = String(pose.depth);
        }
        if (rib) {
          rib.setAttribute('x2', pose.x.toFixed(2));
          rib.setAttribute('y2', pose.y.toFixed(2));
        }
      });
      canopy.current?.setAttribute(
        'points',
        poses.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' '),
      );
    };

    const target = nearestTurn(turn.current, selected, count);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      turn.current = target;
      velocity.current = 0;
      draw();
      return;
    }
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      // A long frame shouldn't throw the spring.
      const elapsed = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      velocity.current +=
        (stiffness * (target - turn.current) - damping * velocity.current) * elapsed;
      turn.current += velocity.current * elapsed;
      const settled = Math.abs(target - turn.current) < 0.001 && Math.abs(velocity.current) < 0.01;
      if (settled) {
        turn.current = target;
        velocity.current = 0;
      }
      draw();
      if (!settled) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [selected, stages, count]);

  const first = stages.map((_, i) => panelPose(i, 0, count));
  return (
    <figure className="umbrella-chart">
      <div className="umbrella">
        <div className="umbrella-visual" aria-hidden="true">
          <svg className="umbrella-frame" viewBox="0 0 100 84">
            <polygon
              ref={canopy}
              className="umbrella-canopy"
              points={first.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
            {first.map(({ x, y }, i) => (
              <line
                key={stages[i]?.id}
                ref={(line) => {
                  ribs.current[i] = line;
                }}
                className="umbrella-rib"
                x1={hub.x}
                y1={hub.y}
                x2={x}
                y2={y}
              />
            ))}
          </svg>
          <p className="umbrella-hub">{run.orchestrator}</p>
          {stages.map((stage, i) => {
            const pose = first[i] as PanelPose;
            const agents = stage.agents.reduce(
              (sum, { count: { default: usual } }) => sum + usual,
              0,
            );
            return (
              <div
                key={stage.id}
                ref={(panel) => {
                  panels.current[i] = panel;
                }}
                className="umbrella-panel"
                style={
                  {
                    transform: panelTransform(pose, 0),
                    zIndex: pose.depth,
                    '--open': pose.open,
                  } as CSSProperties
                }
              >
                <p className="umbrella-closed">
                  <b>{stage.name}</b>
                  <span>{agents === 1 ? '1 agent' : `${agents} agents`}</span>
                </p>
                <div className="umbrella-open">
                  <p className="umbrella-name">{stage.name}</p>
                  <ul>
                    {stage.agents.map((agent) => (
                      <li key={agent.id}>
                        {agentLabel(agent)}
                        <span className="umbrella-dots">{dots(agent.count.default)}</span>
                      </li>
                    ))}
                  </ul>
                  {stage.optional && <p className="umbrella-note">Optional</p>}
                  {stage.cards > 0 && (
                    <p className="umbrella-note">
                      {stage.cards === 1 ? '1 card' : `${stage.cards} cards`} left after it
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {stages.map((stage, i) => {
          const pose = first[i] as PanelPose;
          return (
            <button
              key={stage.id}
              ref={(button) => {
                buttons.current[i] = button;
              }}
              type="button"
              className="umbrella-button"
              style={{ transform: panelTransform(pose, 0), zIndex: pose.depth }}
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
            >
              <span className="visually-hidden">{stage.name}</span>
            </button>
          );
        })}
      </div>
      <figcaption>
        The umbrella: {run.orchestrator} fans out to its stages. Tap a panel to twist it forward and
        see its agents.
      </figcaption>
      <ol className="visually-hidden">
        {list.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </figure>
  );
}
