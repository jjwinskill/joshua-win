// Where the umbrella carousel's panels hang, as a pure function of how far it has turned. A turn of 1 moves
// the ring on by one panel. Units are percent of the carousel's width.
export interface PanelPose {
  /** Where the panel's top middle hangs from. */
  x: number;
  y: number;
  scale: number;
  /** How far it's twisted to face the reader, in degrees. */
  twist: number;
  /** 1 for the panel facing forward, down to 0 for any panel a full step away or more. */
  open: number;
  /** Stacking order: nearer panels are higher. */
  depth: number;
}

const radius = 37;
const frontY = 25;
const backY = 9;
const closedScale = 0.5;

/** How far a panel is from the front, in steps: between -count/2 and count/2. */
function stepsFromFront(index: number, turn: number, count: number): number {
  const steps = (index - turn) % count;
  const wrapped = steps < 0 ? steps + count : steps;
  return wrapped > count / 2 ? wrapped - count : wrapped;
}

export function panelPose(index: number, turn: number, count: number): PanelPose {
  if (count === 1) return { x: 50, y: frontY, scale: 1, twist: 0, open: 1, depth: 100 };
  const steps = stepsFromFront(index, turn, count);
  const angle = (steps / count) * Math.PI * 2;
  const nearness = (1 + Math.cos(angle)) / 2;
  const away = Math.min(Math.abs(steps), 1);
  // Smoothstep, so a panel holds nearly open until it has really moved off.
  const open = 1 - away * away * (3 - 2 * away);
  return {
    x: 50 + Math.sin(angle) * radius,
    y: backY + (frontY - backY) * nearness,
    scale: (closedScale + (1 - closedScale) * open) * (0.86 + 0.14 * nearness),
    // Panels never turn their backs, so no text ever reads mirrored: they angle in at the sides and are flat
    // at the front and the back.
    twist: Math.sin(angle) * 32,
    open,
    depth: Math.round(nearness * 100),
  };
}

/** The whole number nearest a turn that lands on a panel, going the short way round. */
export function nearestTurn(turn: number, index: number, count: number): number {
  return turn + stepsFromFront(index, turn, count);
}
