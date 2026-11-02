import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Swirl } from './Swirl';
import {
  coil,
  flatten,
  geometry,
  K,
  LH,
  lineShift,
  M,
  offset,
  PACE,
  place,
  windScroll,
} from './swirl-math';

// Every letter is 10 px wide, so positions are easy to read.
const measure = (s: string) => s.length * 10;
const W = 390;
const H = 700;
const geo = geometry(W, H);

describe('the prototype’s values', () => {
  test('the geometry on a phone', () => {
    expect(geo.R).toBeCloseTo(390 * 0.27);
    expect(geo.RP).toBeCloseTo(geo.R * Math.sqrt(1 + K * K));
    expect(geo.cx).toBe(195);
    expect(geo.cy).toBeCloseTo(Math.max(30, 700 * 0.06) + geo.R);
    expect(geo.base).toBeCloseTo(geo.cy + geo.R);
  });

  test('the radius stops growing at 130 on a wide stage', () => {
    expect(geometry(1000, H).R).toBe(130);
  });

  test('scrolling runs at 0.75 scroll px per flat px', () => {
    expect(PACE).toBe(0.75);
    expect(windScroll(1000)).toBe(750);
  });
});

describe('from the scroll position to how far along the text', () => {
  test('nothing has moved until the section reaches the top of the screen', () => {
    expect(offset(200, 1000)).toBe(0);
    expect(offset(0, 1000)).toBe(0);
  });

  test('it runs in step with the scroll', () => {
    expect(offset(-375, 1000)).toBe(500);
  });

  test('it holds at the end, so the finished spiral scrolls away as it is', () => {
    expect(offset(-750, 1000)).toBe(1000);
    expect(offset(-5000, 1000)).toBe(1000);
  });
});

describe('the flat text', () => {
  const text = 'aaaa bbbb cccc dddd';

  test('wraps to the stage, inside its margins', () => {
    const { spans } = flatten(text, 2 * M + 100, measure);
    expect(spans).toEqual([
      { start: 0, len: 100 },
      { start: 100, len: 100 },
    ]);
  });

  test('gives each letter its distance along the text, and spaces no glyph', () => {
    const { glyphs, total } = flatten(text, 2 * M + 100, measure);
    expect(glyphs.map((g) => g.ch).join('')).toBe('aaaabbbbccccdddd');
    expect(glyphs[5]).toEqual({ ch: 'b', i: 0, x: 60, U: 60 });
    expect(glyphs[8]).toEqual({ ch: 'c', i: 1, x: 0, U: 100 });
    expect(total).toBe(200);
  });

  test('lines move up one at a time, easing over the last fifth of each', () => {
    const spans = [
      { start: 0, len: 100 },
      { start: 100, len: 100 },
    ];
    expect(lineShift(50, spans)).toBe(0);
    expect(lineShift(90, spans)).toBeCloseTo(0.5);
    expect(lineShift(100, spans)).toBe(1);
    expect(lineShift(500, spans)).toBe(2);
  });
});

describe('a letter’s place', () => {
  const g = { ch: 'a', i: 2, x: 30, U: 800 };
  const span = Math.min(390 * 0.75, 300);

  test('before its turn it sits on its line', () => {
    expect(place(g, 500, 0, geo)).toEqual({ x: M + 30, y: geo.base + LH * 2, rot: 0, s: 1 });
  });

  test('it never sits above the first line', () => {
    expect(place(g, 500, 5, geo).y).toBe(geo.base);
  });

  test('once a full span past its turn it’s on the coil', () => {
    const u = span + 40;
    const c = coil(u, geo);
    const p = place(g, 800 + u, 0, geo);
    expect(p.x).toBeCloseTo(c.x);
    expect(p.y).toBeCloseTo(c.y);
    expect(p.rot).toBeCloseTo(c.rot);
    expect(p.s).toBeCloseTo(c.s);
  });

  test('halfway, it’s eased linearly between the two', () => {
    const c = coil(span / 2, geo);
    const p = place(g, 800 + span / 2, 0, geo);
    const fy = geo.base + LH * 2;
    expect(p.x).toBeCloseTo(M + 30 + (c.x - (M + 30)) / 2);
    expect(p.y).toBeCloseTo(fy + (c.y - fy) / 2);
    expect(p.s).toBeCloseTo(1 + (c.s - 1) / 2);
  });

  test('the coil starts under its center and shrinks as it winds', () => {
    const start = coil(0, geo);
    expect(start.x).toBeCloseTo(geo.cx);
    expect(start.y).toBeCloseTo(geo.cy + geo.R);
    expect(start.s).toBe(1);
    expect(coil(1000, geo).s).toBeCloseTo(Math.exp((-K * 1000) / geo.RP));
  });
});

test('its paragraphs are real, and the canvas is hidden from screen readers', () => {
  const { container } = render(
    <Swirl>
      <p>Lorem ipsum.</p>
      <p>Dolor sit.</p>
    </Swirl>,
  );
  expect(screen.getByText('Lorem ipsum.').tagName).toBe('P');
  expect(screen.getByText('Dolor sit.').tagName).toBe('P');
  expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
});
