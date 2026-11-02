// A cheap prototype (#54, N5): the fan-out as an umbrella. When it comes into view, the orchestrator launches
// its agents one after another, each out along its own rib. Clicking a panel twists it forward and expands
// only that one. The real buttons sit outside the `aria-hidden` visual, placed over its panels (S16). Under
// reduced motion it snaps. It's first on the cut list (S26).
//
// A small spring drives it, writing transforms straight to the panels, because each panel's twist depends
// on where it is on the ring. Plain transitions would spin a panel the long way when it passes the back.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import '../../styles/umbrella.css';
import type { Run, RunStage } from '../../lib/run';
import { runCharts } from '../../lib/run-mermaid';
import {
  goreOutline,
  height,
  hub,
  launchAt,
  launchLasts,
  nearestTurn,
  panelPose,
  ribCurve,
  unfoldAt,
  type PanelPose,
} from './umbrella-pose';

const stiffness = 170;
const damping = 15;

function panelTransform({ x, y, scale, twist }: PanelPose, swing: number): string {
  return `translate(calc(${x}cqi - 50%), ${y}cqi) perspective(60cqi) rotateY(${twist}deg) rotate(${swing}deg) scale(${scale})`;
}

const stringPath = ({ rimX, rimY, x, y }: PanelPose) =>
  `M${rimX.toFixed(2)} ${rimY.toFixed(2)}L${x.toFixed(2)} ${y.toFixed(2)}`;

interface RingAgent {
  key: string;
  name: string;
  optional: boolean;
  stage: RunStage;
  stageIndex: number;
  /** Which of its kind this is, counting from 1, and how many of that kind there are. */
  nth: number;
  of: number;
}

/** One panel per agent the run launches by default. */
function ringAgents(run: Run): RingAgent[] {
  return run.stages.flatMap((stage, stageIndex) =>
    stage.agents.flatMap((agent) =>
      Array.from({ length: agent.count.default }, (_, i) => ({
        key: `${agent.id}-${i}`,
        name: agent.name,
        optional: agent.optional,
        stage,
        stageIndex,
        nth: i + 1,
        of: agent.count.default,
      })),
    ),
  );
}

export function UmbrellaCarousel({ run }: { run: Run }) {
  const agents = useMemo(() => ringAgents(run), [run]);
  const count = agents.length;
  const list = useMemo(() => {
    const lines = runCharts(run).find(({ id }) => id === 'fan-out')?.list ?? [];
    // The panels also say how many cards are left, so the list must too.
    return lines.map((line, i) => {
      const cards = run.stages[i]?.cards;
      return `${line} ${cards === 1 ? '1 card' : `${cards} cards`} left after it.`;
    });
  }, [run]);
  const [selected, setSelected] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const ribs = useRef<(SVGPathElement | null)[]>([]);
  const strings = useRef<(SVGPathElement | null)[]>([]);
  const gores = useRef<(SVGPathElement | null)[]>([]);
  const moveTo = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lasts = launchLasts(count);
    let turn = 0;
    let target = 0;
    let velocity = 0;
    // Seconds since the launch began, and null until it does.
    let clock: number | null = reduced ? lasts : null;
    let frame = 0;
    let last = 0;

    const draw = () => {
      const at = clock ?? 0;
      const unfold = unfoldAt(count, at);
      const poses = agents.map((_, i) => panelPose(i, turn, count, launchAt(i, at), unfold));
      // Panels hang from the rim, so they swing out as it turns.
      const swing = Math.max(-14, Math.min(14, velocity * -5));
      poses.forEach((pose, i) => {
        const transform = panelTransform(pose, swing * (1 - pose.open));
        const panel = panels.current[i];
        const button = buttons.current[i];
        if (panel) {
          panel.style.transform = transform;
          panel.style.zIndex = String(pose.depth);
          panel.style.setProperty('--open', pose.open.toFixed(3));
          panel.style.setProperty('--far', pose.far.toFixed(3));
          panel.style.setProperty('--lit', launchAt(i, at) >= 1 ? '1' : '0');
        }
        if (button) {
          button.style.transform = transform;
          button.style.zIndex = String(pose.depth);
        }
        const rib = ribs.current[i];
        rib?.setAttribute('d', `M${hub.x} ${hub.y}${ribCurve(pose.rimX, pose.rimY)}`);
        rib?.style.setProperty('opacity', (1 - pose.far * 0.65).toFixed(3));
        strings.current[i]?.setAttribute('d', stringPath(pose));
        const next = poses[(i + 1) % count];
        const gore = gores.current[i];
        if (next && gore) {
          gore.setAttribute('d', goreOutline(pose, next));
          // The near side of the canopy hides the far side, so the far side fades out.
          gore.style.setProperty('opacity', (1 - (pose.far + next.far) / 2).toFixed(3));
        }
      });
    };

    const step = (now: number) => {
      // A long frame shouldn't throw the spring.
      const elapsed = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      if (clock !== null) clock = Math.min(lasts, clock + elapsed);
      velocity += (stiffness * (target - turn) - damping * velocity) * elapsed;
      turn += velocity * elapsed;
      const still = Math.abs(target - turn) < 0.001 && Math.abs(velocity) < 0.01;
      if (still) {
        turn = target;
        velocity = 0;
      }
      draw();
      frame = still && (clock === null || clock >= lasts) ? 0 : requestAnimationFrame(step);
    };

    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(step);
    };

    moveTo.current = (index) => {
      target = nearestTurn(turn, index, count);
      if (reduced) {
        turn = target;
        draw();
      } else {
        wake();
      }
    };

    const launch = () => {
      clock ??= 0;
      wake();
    };

    let watcher: IntersectionObserver | undefined;
    if (reduced) {
      draw();
    } else if (typeof IntersectionObserver === 'undefined') {
      launch();
    } else {
      watcher = new IntersectionObserver(
        (entries) => {
          if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
          watcher?.disconnect();
          launch();
        },
        { threshold: 0.4 },
      );
      if (root.current) watcher.observe(root.current);
    }
    return () => {
      watcher?.disconnect();
      cancelAnimationFrame(frame);
      moveTo.current = () => {};
    };
  }, [agents, count]);

  useEffect(() => moveTo.current(selected), [selected]);

  // Folded into the hub until it launches.
  const first = agents.map((_, i) => panelPose(i, 0, count, 0, 0));
  return (
    <figure className="umbrella-chart">
      <div className="umbrella" ref={root} style={{ aspectRatio: `100 / ${height}` }}>
        <div className="umbrella-visual" aria-hidden="true">
          <svg className="umbrella-frame" viewBox={`0 0 100 ${height}`}>
            {agents.map(({ key }, i) => (
              <path
                key={key}
                ref={(gore) => {
                  gores.current[i] = gore;
                }}
                className="umbrella-gore"
              />
            ))}
            {agents.map(({ key }, i) => (
              <path
                key={key}
                ref={(rib) => {
                  ribs.current[i] = rib;
                }}
                className="umbrella-rib"
              />
            ))}
            {agents.map(({ key }, i) => (
              <path
                key={key}
                ref={(line) => {
                  strings.current[i] = line;
                }}
                className="umbrella-string"
              />
            ))}
          </svg>
          <p className="umbrella-hub">{run.orchestrator}</p>
          {agents.map((agent, i) => {
            const pose = first[i] as PanelPose;
            const { stage } = agent;
            return (
              <div
                key={agent.key}
                ref={(panel) => {
                  panels.current[i] = panel;
                }}
                className={`umbrella-panel umbrella-stage-${agent.stageIndex % 4}`}
                style={
                  {
                    transform: panelTransform(pose, 0),
                    zIndex: pose.depth,
                    '--open': 0,
                    '--far': pose.far,
                    '--lit': 0,
                  } as CSSProperties
                }
              >
                <p className="umbrella-closed">
                  <b>{agent.name}</b>
                  <span>{agent.of > 1 ? `${agent.nth} of ${agent.of}` : stage.name}</span>
                </p>
                <div className="umbrella-open">
                  <p className="umbrella-eyebrow">
                    {stage.name}
                    {stage.optional && ' · optional'}
                  </p>
                  <p className="umbrella-name">{agent.name}</p>
                  {agent.of > 1 && (
                    <p className="umbrella-pips">
                      {Array.from({ length: agent.of }, (_, pip) => (
                        <i key={pip} className={pip === agent.nth - 1 ? 'on' : undefined} />
                      ))}
                      <span>
                        {agent.nth} of {agent.of}
                      </span>
                    </p>
                  )}
                  {agent.optional && <p className="umbrella-note">Optional</p>}
                  <p className="umbrella-cards">
                    {stage.cards > 0 ? (
                      <>
                        <b>{stage.cards}</b> {stage.cards === 1 ? 'card' : 'cards'} left after{' '}
                        {stage.name}
                      </>
                    ) : (
                      'No cards yet'
                    )}
                  </p>
                </div>
                <i className="umbrella-lamp" />
              </div>
            );
          })}
        </div>
        {agents.map((agent, i) => {
          const pose = first[i] as PanelPose;
          return (
            <button
              key={agent.key}
              ref={(button) => {
                buttons.current[i] = button;
              }}
              type="button"
              className="umbrella-button"
              style={{ transform: panelTransform(pose, 0), zIndex: pose.depth }}
              aria-pressed={i === selected}
              onClick={() => setSelected(i)}
            >
              <span className="visually-hidden">
                {agent.of > 1 ? `${agent.name}, ${agent.nth} of ${agent.of}` : agent.name}
              </span>
            </button>
          );
        })}
      </div>
      <figcaption>
        The umbrella: {run.orchestrator} launches its {count} agents. Tap a panel to twist it
        forward and open it.
      </figcaption>
      <ol className="visually-hidden">
        {list.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </figure>
  );
}
