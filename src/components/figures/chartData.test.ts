import { describe, expect, it } from 'vitest';
import { chartPeak, chartPoints, chartSize } from './chartData';

describe('chartPoints', () => {
  it('gives about 2,000 points inside the chart', () => {
    const points = chartPoints(30);
    expect(points).toHaveLength(2000);
    expect(points.every(({ x }) => x >= 0 && x <= chartSize.width)).toBe(true);
  });

  it('gives the same points for the same step, and moves them for another', () => {
    expect(chartPoints(30)).toEqual(chartPoints(30));
    expect(chartPoints(30)[100]?.y).not.toBe(chartPoints(60)[100]?.y);
  });
});

it('finds the highest point, which has the smallest y', () => {
  expect(
    chartPeak([
      { x: 1, y: 5 },
      { x: 2, y: 3 },
    ]),
  ).toEqual({ x: 2, y: 3 });
});
