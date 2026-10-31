// Placeholder data for the heavy page's chart: points on a wave that shifts as the reader scrubs.
export const chartSize = { width: 600, height: 300 };
export const chartSteps = 100;

export interface ChartPoint {
  x: number;
  y: number;
}

// The same step always gives the same points, so the server's and the browser's renders agree.
export function chartPoints(step: number, count = 2000): ChartPoint[] {
  const phase = (step / chartSteps) * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const along = i / count;
    const jitter = Math.sin(i * 12.9898) * 43758.5453;
    const noise = jitter - Math.floor(jitter) - 0.5;
    const wave = Math.sin(along * Math.PI * 6 + phase) * 0.32;
    return {
      x: along * chartSize.width,
      y: (0.5 + wave + noise * 0.28) * chartSize.height,
    };
  });
}

export function chartPeak(points: readonly ChartPoint[]): ChartPoint | undefined {
  return points.reduce<ChartPoint | undefined>(
    (peak, point) => (!peak || point.y < peak.y ? point : peak),
    undefined,
  );
}
