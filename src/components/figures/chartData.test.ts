import { describe, expect, it } from 'vitest';
import { chartPoints, chartSample, chartSize } from './chartData';

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

it('samples evenly spaced points for the screen-reader list', () => {
  const sample = chartSample(30);
  expect(sample).toHaveLength(10);
  expect(sample[1]).toEqual(chartPoints(30)[200]);
});
