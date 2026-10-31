// Placeholder data for the heavy page's chart: points on a wave that shifts as the reader scrubs.
export const chartSize = { width: 600, height: 300 };
export const chartSteps = 100;

export interface ChartPoint {
  x: number;
  y: number;
}

// The same step always gives the same points.
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

// A few evenly spaced points, for the list screen readers get in place of the chart.
export function chartSample(step: number, size = 10): ChartPoint[] {
  const points = chartPoints(step);
  return Array.from(
    { length: size },
    (_, i) => points[Math.floor((i / size) * points.length)],
  ).filter((point) => point !== undefined);
}
