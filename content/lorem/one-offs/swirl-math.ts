// The Swirl's math, ported unchanged from the phone prototype (G35). Every letter's place is a pure function
// of one number: how far the section has scrolled. Don't tune these values before V1 ships.
export const PX = 17;
export const LH = 27;
export const M = 20;
export const K = 0.14;
export const PACE = 0.75;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);

export interface Glyph {
  ch: string;
  i: number;
  x: number;
  U: number;
}

export interface Span {
  start: number;
  len: number;
}

export interface Flat {
  glyphs: Glyph[];
  spans: Span[];
  total: number;
}

export interface Geometry {
  W: number;
  R: number;
  RP: number;
  cx: number;
  cy: number;
  base: number;
}

export function geometry(W: number, H: number): Geometry {
  const R = Math.min(W * 0.27, 130);
  const cy = Math.max(30, H * 0.06) + R;
  return { W, R, RP: R * Math.sqrt(1 + K * K), cx: W / 2, cy, base: cy + R };
}

// Breaks the text into lines and gives each letter its distance along the flat text.
export function flatten(text: string, W: number, measure: (s: string) => number): Flat {
  const width = W - M - M;
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const t = cur ? cur + ' ' + w : w;
    if (measure(t) > width && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  lines.push(cur);
  const glyphs: Glyph[] = [];
  const spans: Span[] = [];
  let U = 0;
  lines.forEach((line, i) => {
    const len = measure(line + ' ');
    spans.push({ start: U, len });
    for (let g = 0; g < line.length; g++) {
      const ch = line.charAt(g);
      if (ch === ' ') continue;
      const x = measure(line.slice(0, g));
      glyphs.push({ ch, i, x, U: U + x });
    }
    U += len;
  });
  return { glyphs, spans, total: U };
}

export const windScroll = (total: number) => total * PACE;

// How far along the flat text the reader has scrolled, from the section's top edge against the screen's.
export function offset(sectionTop: number, total: number): number {
  return total * clamp(-sectionTop / windScroll(total), 0, 1);
}

// How many lines the flat text has moved up, so the next sentence arrives in place below the coil.
export function lineShift(O: number, spans: Span[]): number {
  let a = spans.findIndex((s) => O < s.start + s.len);
  if (a < 0) a = spans.length;
  const sp = spans[Math.min(a, spans.length - 1)] ?? { start: 0, len: 1 };
  const within = a < spans.length ? clamp((O - sp.start) / sp.len, 0, 1) : 1;
  return a + ease(clamp((within - 0.8) / 0.2, 0, 1)) - (a < spans.length ? 0 : 1);
}

export function coil(u: number, { R, RP, cx, cy }: Geometry) {
  const phi = u / RP;
  const s = Math.exp(-K * phi);
  const r = R * s;
  return { x: cx - r * Math.sin(phi), y: cy + r * Math.cos(phi), rot: phi - Math.atan(K), s };
}

// Each letter, in flat-text order, leaves its line and eases linearly onto the coil.
export function place(g: Glyph, O: number, shift: number, geo: Geometry) {
  const u = O - g.U;
  const row = g.i - shift;
  const span = Math.min(geo.W * 0.75, 300);
  const fx = M + g.x;
  const fy = geo.base + LH * Math.max(row, 0);
  const c = coil(Math.max(0, u), geo);
  const t = clamp(u / span, 0, 1);
  if (t <= 0) return { x: fx, y: fy, rot: 0, s: 1 };
  return {
    x: fx + (c.x - fx) * t,
    y: fy + (c.y - fy) * t,
    rot: c.rot * t,
    s: 1 + (c.s - 1) * t,
  };
}
