// The sheet Josh draws the cast on (P5): one box per cast member, at a fixed scale, with the shared
// legs and their hip line printed in place. Four corner squares let a photo of it be squared up.
import { Legs } from './CastFigure';
import { RIG } from './rig';

const SHEET_CAST = [
  'Haňťa',
  'A crumpled sheet of paper',
  'The giant new hydraulic press at Bubny',
  'A glass of milk',
];

// At this scale a line as thick as the legs is about 3.4 mm: a thick marker.
const INCHES_PER_UNIT = 0.075;
const MARGIN = 1.2;
const MARK = 1;

function DrawingBox() {
  const corners = [
    [-MARGIN, -MARGIN],
    [RIG.width + MARGIN - MARK, -MARGIN],
    [-MARGIN, RIG.height + MARGIN - MARK],
    [RIG.width + MARGIN - MARK, RIG.height + MARGIN - MARK],
  ] as const;
  const viewWidth = RIG.width + MARGIN * 2;
  const viewHeight = RIG.height + MARGIN * 2;
  return (
    <svg
      viewBox={`${-MARGIN} ${-MARGIN} ${viewWidth} ${viewHeight}`}
      width={`${viewWidth * INCHES_PER_UNIT}in`}
      height={`${viewHeight * INCHES_PER_UNIT}in`}
      aria-hidden="true"
      focusable="false"
      fill="none"
    >
      {corners.map(([x, y]) => (
        <rect key={`${x},${y}`} x={x} y={y} width={MARK} height={MARK} fill="#000" />
      ))}
      <rect x="0" y="0" width={RIG.width} height={RIG.height} stroke="#999" strokeWidth="0.1" />
      <g stroke="#ccc" strokeWidth={RIG.strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <Legs />
      </g>
      <line
        data-hip-line
        x1="0"
        y1={RIG.hipY}
        x2={RIG.width}
        y2={RIG.hipY}
        stroke="#000"
        strokeWidth="0.15"
        strokeDasharray="0.8 0.6"
      />
      <path
        d={`M${RIG.torsoPivotX - 0.8} ${RIG.hipY}h1.6M${RIG.torsoPivotX} ${RIG.hipY - 0.8}v1.6`}
        stroke="#000"
        strokeWidth="0.25"
      />
      <text x="0.6" y={RIG.hipY + 1.6} fontSize="1.3" fill="#555">
        hip line
      </text>
    </svg>
  );
}

export function TemplateSheet() {
  return (
    <main className="sheet">
      <h1>Cast template sheet</h1>
      <ol>
        <li>
          Print at 100% (“Actual size”), not “Fit to page”. This bar should measure one inch:{' '}
          <span className="inch" />
        </li>
        <li>
          Use a thick black marker, with a line as thick as the gray legs. Note any colors beside
          the box.
        </li>
        <li>
          Draw the body only, inside the box and above the hip line. It should reach the hip line
          over both legs, because that’s where they join. It bows from the small cross.
        </li>
        <li>
          Photograph the sheet flat from straight above, in even light, with all the black squares
          in the frame. Draw Haňťa first and send that photo before drawing the rest.
        </li>
      </ol>
      <div className="boxes">
        {SHEET_CAST.map((name) => (
          <figure key={name}>
            <figcaption>{name}</figcaption>
            <DrawingBox />
          </figure>
        ))}
      </div>
    </main>
  );
}
