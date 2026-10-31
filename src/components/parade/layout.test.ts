import { describe, expect, it } from 'vitest';
import {
  exitPositions,
  gatheredPositions,
  lineFraction,
  slotPositions,
  walkDuration,
} from './layout';

describe('lineFraction', () => {
  it('maps a mention to where the fill will be when the reader passes it', () => {
    expect(lineFraction(1600, 600, 2000)).toBe(0.5);
  });

  it('stays on the line for mentions before the start or past the end', () => {
    expect(lineFraction(100, 600, 2000)).toBe(0);
    expect(lineFraction(9000, 600, 2000)).toBe(1);
  });
});

describe('slotPositions', () => {
  const stage = 1000;
  const cast = 40;

  it('puts each slot at its fraction when they’re far apart', () => {
    expect(slotPositions([0.2, 0.5, 0.8], stage, cast)).toEqual([200, 500, 800]);
  });

  it('pushes close mentions apart by at least the gap', () => {
    const [a = 0, b = 0, c = 0] = slotPositions([0.5, 0.5, 0.5], stage, cast);
    expect(b - a).toBeCloseTo(48);
    expect(c - b).toBeCloseTo(48);
  });

  it('keeps everyone on stage, even when the mentions bunch at an end', () => {
    const atEnd = slotPositions([1, 1, 1, 1], stage, cast);
    const [first = 0, second = 0] = atEnd;
    expect(atEnd.at(-1)).toBe(stage - cast / 2);
    expect(second - first).toBeCloseTo(48);
    expect(slotPositions([0, 0], stage, cast)[0]).toBe(cast / 2);
  });
});

it('gathers the cast evenly around centre stage', () => {
  const [a = 0, b = 0] = gatheredPositions(2, 1000, 40);
  expect((a + b) / 2).toBe(500);
  expect(b - a).toBe(68);
});

it('sends the cast off stage right, each further than the last', () => {
  expect(exitPositions(2, 1000)).toEqual([1080, 1086]);
});

it('never walks faster than a short stroll allows', () => {
  expect(walkDuration(1, 0.15)).toBe(400);
  expect(walkDuration(-300, 0.15)).toBe(2000);
});
