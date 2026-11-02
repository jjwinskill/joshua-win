// Where the umbrella carousel's parts sit, as a pure function of how far it has turned and how far it has
// launched. A turn of 1 moves the ring on by one panel. Units are percent of the carousel's width.
export interface PanelPose {
  /** The tip of its rib, on the umbrella's rim. */
  rimX: number;
  rimY: number;
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
  /** 1 at the very back, 0 at the very front. */
  far: number;
}

export const hub = { x: 50, y: 7 };
export const height = 138;

const rim = { y: 36, radiusX: 39, radiusY: 26 };
/** How far below the rim a closed panel hangs, and how much further the open one drops. */
const hang = 2.5;
const drop = 16;
const closedScale = { near: 0.36, far: 0.27 };

/** How far a panel is from the front, in steps: between -count/2 and count/2. */
function stepsFromFront(index: number, turn: number, count: number): number {
  const steps = (index - turn) % count;
  const wrapped = steps < 0 ? steps + count : steps;
  return wrapped > count / 2 ? wrapped - count : wrapped;
}

/**
 * @param launch 0 folded into the hub, 1 out on the rim. It can overshoot on the way.
 * @param unfold 0 keeps even the front panel closed, 1 lets it open.
 */
export function panelPose(
  index: number,
  turn: number,
  count: number,
  launch = 1,
  unfold = 1,
): PanelPose {
  const steps = count === 1 ? 0 : stepsFromFront(index, turn, count);
  const angle = (steps / count) * Math.PI * 2;
  const nearness = (1 + Math.cos(angle)) / 2;
  const away = Math.min(Math.abs(steps), 1);
  // Smoothstep, so a panel holds nearly open until it has really moved off.
  const open = (1 - away * away * (3 - 2 * away)) * unfold;
  const rimX = hub.x + Math.sin(angle) * rim.radiusX * launch;
  const rimY = hub.y + (rim.y + Math.cos(angle) * rim.radiusY - hub.y) * launch;
  const closed = closedScale.far + (closedScale.near - closedScale.far) * nearness;
  return {
    rimX,
    rimY,
    x: rimX,
    y: rimY + (hang + drop * open) * launch,
    scale: (closed + (1 - closed) * open) * launch,
    // Panels never turn their backs, so no text ever reads mirrored: they angle in at the sides and are flat
    // at the front and the back.
    twist: Math.sin(angle) * 22 * (1 - open),
    open,
    depth: Math.round(nearness * 100 + open * 50),
    far: 1 - nearness,
  };
}

/** The curve of a rib from the hub to a panel: up and over. */
export function ribCurve(x: number, y: number): string {
  const bendX = hub.x + (x - hub.x) * 0.66;
  const bendY = hub.y + (y - hub.y) * 0.22;
  return `Q${bendX.toFixed(2)} ${bendY.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
}

/** Which panel is nearest the front at a turn. */
export function panelAt(turn: number, count: number): number {
  return ((Math.round(turn) % count) + count) % count;
}

/** The whole number nearest a turn that lands on a panel, going the short way round. */
export function nearestTurn(turn: number, index: number, count: number): number {
  return turn + stepsFromFront(index, turn, count);
}

/** How far panel `index` has launched, `clock` seconds in. They go out one after another. */
const launchGap = 0.085;
const launchLength = 0.75;
const unfoldLength = 0.44;

export function launchAt(index: number, clock: number): number {
  const t = Math.min(1, Math.max(0, (clock - index * launchGap) / launchLength));
  // Ease out with a little overshoot, like something flung out and caught by its rib.
  const back = 1.4;
  return 1 + (back + 1) * (t - 1) ** 3 + back * (t - 1) ** 2;
}

/** How far the front panel has opened, `clock` seconds in: it waits until the ring is nearly out. */
export function unfoldAt(count: number, clock: number): number {
  const t = (clock - (count - 1) * launchGap - launchLength * 0.8) / unfoldLength;
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

export function launchLasts(count: number): number {
  return (count - 1) * launchGap + launchLength * 0.8 + unfoldLength;
}
