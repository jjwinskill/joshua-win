// One cast member: a torso from the registry on the shared legs. The hip is at y=33, the knee at
// y=39.5 and the ankle at y=45.5, as in docs/demo/parade.html. The class names are what the parade's
// walk and bow will animate.
import { castRegistry, type CastKey } from './registry';

function Leg({ x, className }: { x: number; className: string }) {
  return (
    <g className={className}>
      <g className="thigh" style={{ transformOrigin: `${x}px 33px` }}>
        <line x1={x} y1="33" x2={x} y2="39.5" />
        <g className="shin" style={{ transformOrigin: `${x}px 39.5px` }}>
          <line x1={x} y1="39.5" x2={x} y2="45.5" />
          <line x1={x} y1="45.5" x2={x + 3.4} y2="45.5" />
        </g>
      </g>
    </g>
  );
}

export function CastFigure({ castKey }: { castKey: CastKey }) {
  const { Torso } = castRegistry[castKey];
  return (
    <svg
      viewBox="0 0 40 47"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="#231f1a"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g className="legs">
        <Leg x={23} className="leg-back" />
        <Leg x={17} className="leg-front" />
      </g>
      <g className="torso" style={{ transformOrigin: '20px 33px' }}>
        <Torso />
      </g>
    </svg>
  );
}
