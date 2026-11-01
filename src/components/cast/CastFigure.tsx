// One cast member: a torso from the registry on the shared legs, whose measurements are in rig.ts. The
// class names are what the parade's walk and bow will animate.
import { castRegistry, type CastKey } from './registry';
import { RIG } from './rig';

function Leg({ x, className }: { x: number; className: string }) {
  return (
    <g className={className}>
      <g className="thigh" style={{ transformOrigin: `${x}px ${RIG.hipY}px` }}>
        <line x1={x} y1={RIG.hipY} x2={x} y2={RIG.kneeY} />
        <g className="shin" style={{ transformOrigin: `${x}px ${RIG.kneeY}px` }}>
          <line x1={x} y1={RIG.kneeY} x2={x} y2={RIG.ankleY} />
          <line x1={x} y1={RIG.ankleY} x2={x + RIG.footLength} y2={RIG.ankleY} />
        </g>
      </g>
    </g>
  );
}

export function Legs() {
  return (
    <g className="legs">
      <Leg x={RIG.backLegX} className="leg-back" />
      <Leg x={RIG.frontLegX} className="leg-front" />
    </g>
  );
}

export function CastFigure({ castKey }: { castKey: CastKey }) {
  const { Torso } = castRegistry[castKey];
  return (
    <svg
      viewBox={`0 0 ${RIG.width} ${RIG.height}`}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="#231f1a"
      strokeWidth={RIG.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Legs />
      <g className="torso" style={{ transformOrigin: `${RIG.torsoPivotX}px ${RIG.hipY}px` }}>
        <Torso />
      </g>
    </svg>
  );
}
