// The Swirl: a section of piece 3 whose text curls up and sinks into a shrinking spiral as the page scrolls.
// It's the phone prototype's pattern, unchanged (G35): the math is in swirl-math.ts, and what's different here
// is only what shipping needs. The real paragraphs come in as children. They're what a screen reader gets, what
// reduced motion and no JavaScript show, and what stays on screen until the first draw. The section's height
// and sticky stage come from CSS, so hydrating doesn't move the page. It only reads the scroll position.
import { useEffect, useRef, type ReactNode } from 'react';
import {
  flatten,
  geometry,
  lineShift,
  offset,
  place,
  PX,
  windScroll,
  type Flat,
} from './swirl-math';

function startSwirl(section: HTMLElement, stage: HTMLElement, canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return () => undefined;
  const ctx: CanvasRenderingContext2D = context;
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  const text = [...section.querySelectorAll('p')]
    .map((p) => (p.textContent ?? '').trim())
    .join(' ')
    .replace(/\s+/g, ' ');

  const family = getComputedStyle(section).fontFamily;
  const font = `${PX}px ${family}`;
  let flat: Flat | undefined;
  let geo = geometry(0, 0);
  let D = 1;
  let ink = '';
  let lastW = 0;
  let lastTop: number | undefined;
  let frame = 0;
  let visible = false;
  let running = false;
  let observer: IntersectionObserver | undefined;

  function readInk() {
    ink = getComputedStyle(section).color;
    lastTop = undefined;
  }

  function layout() {
    lastW = innerWidth;
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    D = Math.min(3, devicePixelRatio || 1);
    canvas.width = W * D;
    canvas.height = H * D;
    geo = geometry(W, H);
    ctx.font = font;
    flat = flatten(text, W, (s) => ctx.measureText(s).width);
    section.style.setProperty('--swirl-wind', `${windScroll(flat.total)}px`);
    lastTop = undefined;
  }

  function draw() {
    if (!flat) return;
    const top = section.getBoundingClientRect().top;
    if (top === lastTop) return;
    lastTop = top;
    const O = offset(top, flat.total);
    const shift = lineShift(O, flat.spans);
    const { W } = geo;
    const H = canvas.height / D;
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.font = font;
    ctx.fillStyle = ink;
    for (const g of flat.glyphs) {
      const { x, y, rot, s } = place(g, O, shift, geo);
      if (y < -30 || y > H + 30 || x < -30 || x > W + 30 || s * PX < 1) continue;
      const cos = D * s * Math.cos(rot);
      const sin = D * s * Math.sin(rot);
      ctx.setTransform(cos, sin, -sin, cos, D * x, D * y);
      ctx.fillText(g.ch, 0, 0);
    }
  }

  function loop() {
    if (!visible || !running) {
      frame = 0;
      return;
    }
    draw();
    frame = requestAnimationFrame(loop);
  }

  // Canvas text doesn't load a font by itself. Measuring in the fallback would give the wrong letters.
  function run() {
    running = true;
    void document.fonts
      .load(`${PX}px ${family}`, text)
      .catch(() => undefined)
      .then(() => {
        if (!running) return;
        readInk();
        layout();
        // Back can restore a scrolled page, so draw now as well as on scroll. The position is right either way.
        draw();
        section.dataset.drawn = '';
        observer?.disconnect();
        observer = new IntersectionObserver(
          ([entry]) => {
            visible = !!entry?.isIntersecting;
            if (visible && !frame) frame = requestAnimationFrame(loop);
          },
          { rootMargin: '200px' },
        );
        observer.observe(section);
      });
  }

  function halt() {
    running = false;
    visible = false;
    cancelAnimationFrame(frame);
    frame = 0;
    observer?.disconnect();
    delete section.dataset.drawn;
    section.style.removeProperty('--swirl-wind');
  }

  const onResize = () => {
    if (running && flat && innerWidth !== lastW) layout();
  };
  const onMotion = () => (motion.matches ? run() : halt());

  addEventListener('resize', onResize);
  motion.addEventListener('change', onMotion);
  scheme.addEventListener('change', readInk);
  if (motion.matches) run();

  return () => {
    halt();
    removeEventListener('resize', onResize);
    motion.removeEventListener('change', onMotion);
    scheme.removeEventListener('change', readInk);
  };
}

export function Swirl({ children }: { children?: ReactNode }) {
  const section = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (section.current && stage.current && canvas.current) {
      return startSwirl(section.current, stage.current, canvas.current);
    }
  }, []);

  return (
    <div className="swirl" ref={section}>
      <div className="swirl-stage" ref={stage}>
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <div className="swirl-text">{children}</div>
    </div>
  );
}
