// The parade's pure logic: where each slot sits, where the cast gathers, and how long a walk takes.
// docs/demo/parade.html is the spec for its motion.

// Where along the line (0 to 1) the progress fill will be when the reader passes a mention.
export function lineFraction(mentionTop: number, trigger: number, maxScroll: number): number {
  return Math.min(1, Math.max(0, (mentionTop - trigger) / Math.max(1, maxScroll)));
}

// Each slot sits where the line will be at its mention, pushed apart so that no two overlap.
export function slotPositions(
  fractions: readonly number[],
  stageWidth: number,
  castWidth: number,
): number[] {
  const gap = castWidth * 1.2;
  const positions = fractions.map((fraction) => fraction * stageWidth);
  positions.reduce(
    (previous, position, i) => {
      const pushed = Math.max(position, previous === null ? castWidth / 2 : previous + gap);
      positions[i] = pushed;
      return pushed;
    },
    null as number | null,
  );
  for (let i = positions.length - 1; i >= 0; i--) {
    const limit =
      i < positions.length - 1 ? (positions[i + 1] ?? 0) - gap : stageWidth - castWidth / 2;
    positions[i] = Math.min(positions[i] ?? 0, limit);
  }
  return positions;
}

// Centre stage, for the curtain call.
export function gatheredPositions(count: number, stageWidth: number, castWidth: number): number[] {
  const gap = castWidth * 1.7;
  const start = stageWidth / 2 - ((count - 1) * gap) / 2;
  return Array.from({ length: count }, (_, i) => start + i * gap);
}

// Off stage right, each a little further than the last so that they don't stack.
export function exitPositions(count: number, stageWidth: number): number[] {
  return Array.from({ length: count }, (_, i) => stageWidth + 80 + i * 6);
}

export function walkDuration(distance: number, speed: number): number {
  return Math.max(400, Math.abs(distance) / speed);
}
