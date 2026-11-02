// A cheap prototype (#55): as you scroll, a robot's open cranium catches a falling brain, snaps shut and
// switches on, and then its stages light up. The motion is all CSS on a `view()` timeline (robot.css), so
// this ships no JavaScript and has nothing to clean up: the page uses it with no client directive. The
// markup is the finished robot, which is what reduced motion and browsers without support get.
//
// Each moving part is its own small SVG on one shared viewBox, because a browser can run an animation on
// an element's own layer off the main thread, but not on a shape inside an SVG. The art is placeholder.
import '../../styles/robot.css';
import type { Run } from '../../lib/run';

const box = '0 0 360 470';

/** Where the lamps' switching on sits on the timeline, as percentages. */
const lampsFrom = 46;
const lampsTo = 80;

/** One arm, in the spirit of Bender's and Rosie's: a ribbed hose, a ball shoulder and a three-fingered grip. */
function Arm({ side }: { side: -1 | 1 }) {
  const at = (x: number) => 180 + side * x;
  const point = (t: number): [number, number] => {
    const u = 1 - t;
    return [
      at(u * u * 82 + 2 * u * t * 122 + t * t * 112),
      u * u * 322 + 2 * u * t * 348 + t * t * 392,
    ];
  };
  const ribs = Array.from({ length: 8 }, (_, i) => {
    const t = (i + 1) / 9;
    const [x, y] = point(t);
    const [x2, y2] = point(t + 0.01);
    const length = Math.hypot(x2 - x, y2 - y);
    const nx = ((y2 - y) / length) * 8;
    const ny = ((x - x2) / length) * 8;
    return `M${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}L${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)}`;
  }).join('');
  return (
    <>
      <path className="robot-hose-edge" d={`M${at(82)} 322Q${at(122)} 348 ${at(112)} 392`} />
      <path className="robot-hose" d={`M${at(82)} 322Q${at(122)} 348 ${at(112)} 392`} />
      <path className="robot-hose-rib" d={ribs} />
      <circle className="robot-metal" cx={at(84)} cy="322" r="13" />
      <circle className="robot-bolt" cx={at(84)} cy="322" r="3.5" />
      <g transform={`translate(${at(112)} 392) rotate(${side * 8})`}>
        <path className="robot-metal" d="M-20 18C-26 34-22 44-15 46-11 46-10 42-12 36L-10 22" />
        <path className="robot-metal" d="M20 18C26 34 22 44 15 46 11 46 10 42 12 36L10 22" />
        <path className="robot-metal" d="M-7 20C-7 36-7 50 0 51 7 50 7 36 7 20" />
        <rect className="robot-metal" x="-21" y="6" width="42" height="18" rx="9" />
        <rect className="robot-metal" x="-13" y="-4" width="26" height="11" rx="3" />
      </g>
    </>
  );
}

export function robotList(run: Run): string[] {
  return [
    `${run.orchestrator} starts with an open cranium, switched off.`,
    'A brain falls in, the cranium snaps shut, and it switches on.',
    `Then it lights its stages, one by one: ${run.stages.map(({ name }) => name).join(', ')}.`,
  ];
}

export function ScrollRobot({ run }: { run: Run }) {
  const { stages } = run;
  // Rows on the chest, which get smaller if the run file has more stages.
  const rowHeight = Math.min(22, 92 / stages.length);
  const rowY = (i: number) => 345 + rowHeight * i;
  const step = (lampsTo - lampsFrom) / stages.length;
  return (
    <figure className="robot-chart">
      <div className="robot-track">
        <div className="robot-stage">
          <div className="robot" aria-hidden="true">
            <div className="robot-whole">
              <svg className="robot-part" viewBox={box}>
                <ellipse className="robot-dark" cx="180" cy="190" rx="66" ry="11" />
                <rect className="robot-metal" x="164" y="288" width="32" height="16" />
                <Arm side={-1} />
                <rect className="robot-metal" x="94" y="302" width="172" height="136" rx="14" />
                <rect className="robot-metal" x="118" y="438" width="44" height="22" rx="8" />
                <rect className="robot-metal" x="198" y="438" width="44" height="22" rx="8" />
              </svg>
              <svg className="robot-part robot-arm" viewBox={box}>
                <Arm side={1} />
              </svg>
              <svg className="robot-part robot-brain" viewBox={box}>
                <path
                  className="robot-brain-fill"
                  d="M180 196c-34 6-54-8-52-30 2-16 14-20 20-20 2-14 18-22 32-14 14-8 30 0 32 14 6 0 18 4 20 20 2 22-18 36-52 30z"
                />
                <path
                  className="robot-brain-fold"
                  d="M180 132v62M148 146c-2 12 8 16 16 12M212 146c2 12-8 16-16 12M136 172c8 6 18 2 22-4M224 172c-8 6-18 2-22-4"
                />
              </svg>
              <svg className="robot-part" viewBox={box}>
                <rect className="robot-metal" x="100" y="188" width="160" height="102" rx="12" />
                <path className="robot-face-off" d="M136 232h28M196 232h28M160 266h40" />
                <text className="robot-plate" x="180" y="326">
                  {run.orchestrator}
                </text>
                {stages.map(({ id, name }, i) => (
                  <text
                    key={id}
                    className="robot-stage-name"
                    x="130"
                    y={rowY(i)}
                    fontSize={Math.min(14, rowHeight - 4)}
                  >
                    {name}
                  </text>
                ))}
                {stages.map(({ id }, i) => (
                  <circle key={id} className="robot-lamp-off" cx="116" cy={rowY(i) - 5} r="5.5" />
                ))}
              </svg>
              <svg className="robot-part robot-face-on" viewBox={box}>
                <rect className="robot-face-patch" x="125" y="212" width="110" height="64" />
                <circle className="robot-eye-glow" cx="150" cy="232" r="19" />
                <circle className="robot-eye-glow" cx="210" cy="232" r="19" />
                <circle className="robot-eye" cx="150" cy="232" r="11" />
                <circle className="robot-eye" cx="210" cy="232" r="11" />
                <path className="robot-smile" d="M156 258c10 14 38 14 48 0" />
              </svg>
              {stages.map(({ id }, i) => (
                <i
                  key={id}
                  className="robot-lamp"
                  style={{
                    left: `${(116 / 360) * 100}%`,
                    top: `${((rowY(i) - 5) / 470) * 100}%`,
                    ['--lamp-from' as string]: `${lampsFrom + step * i}%`,
                    ['--lamp-to' as string]: `${lampsFrom + step * (i + 0.6)}%`,
                  }}
                />
              ))}
              <svg className="robot-part robot-lid" viewBox={box}>
                <path className="robot-dome" d="M106 190a74 74 0 0 1 148 0z" />
                <path className="robot-dome-shine" d="M130 170c4-16 16-26 30-30" />
              </svg>
            </div>
            <svg className="robot-part robot-clack" viewBox={box}>
              <path
                className="robot-spark"
                d="M84 130 62 112M72 176l-30-4M276 130l22-18M288 176l30-4M180 96V66M128 104l-12-26M232 104l12-26"
              />
              <text className="robot-clack-word" x="180" y="52">
                CLANK!
              </text>
            </svg>
          </div>
          <figcaption>
            The robot: {run.orchestrator} is dark until its brain lands. Then it snaps shut,
            switches on and lights its stages.
          </figcaption>
        </div>
      </div>
      <ol className="visually-hidden">
        {robotList(run).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
    </figure>
  );
}
