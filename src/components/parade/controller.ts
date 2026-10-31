// Drives the parade on scroll. It changes classes and CSS variables directly rather than through React
// state, so scrolling never re-renders anything. docs/demo/parade.html is the spec for its motion.
import {
  exitPositions,
  gatheredPositions,
  lineFraction,
  slotPositions,
  walkDuration,
} from './layout';

export interface ParadeActor {
  slot: HTMLElement;
  art: HTMLElement;
  mention: HTMLElement;
}

interface ParadeOptions {
  root: HTMLElement;
  stage: HTMLElement;
  fill: HTMLElement;
  actors: readonly ParadeActor[];
  end: HTMLElement;
}

export interface ParadeController {
  jumpTo(index: number): void;
  replay(): void;
  destroy(): void;
}

type Timers = Set<ReturnType<typeof setTimeout>>;

const between = (low: number, high: number) => low + Math.random() * (high - low);

export function createParade({ root, stage, fill, actors, end }: ParadeOptions): ParadeController {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = actors.map(() => ({ x: 0, home: 0, passed: false }));
  // The curtain call's timers are cancelled when it resets. A flash outlives that.
  const curtainTimers: Timers = new Set();
  const flashTimers: Timers = new Set();
  let maxScroll = 1;
  let stageWidth = 1;
  let trigger = 0;
  let phase: 'reading' | 'gathered' | 'gone' = 'reading';
  let frame = 0;

  const later = (run: () => void, ms: number, timers = curtainTimers) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      run();
    }, ms);
    timers.add(timer);
  };

  const castWidth = () => parseFloat(getComputedStyle(root).getPropertyValue('--cast-width')) || 44;

  function place(i: number, x: number, ms = 0) {
    const actor = actors[i];
    const now = state[i];
    if (!actor || !now) return;
    actor.slot.style.setProperty('--move', `${motion.matches ? 0 : ms}ms`);
    actor.art.classList.toggle('facing-left', ms > 0 && x < now.x);
    actor.slot.style.setProperty('--x', `${x}px`);
    now.x = x;
  }

  function layout() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    stageWidth = stage.clientWidth;
    trigger = innerHeight * 0.6;
    const width = castWidth();
    const fractions = actors.map(({ mention }) =>
      lineFraction(mention.getBoundingClientRect().top + scrollY, trigger, maxScroll),
    );
    slotPositions(fractions, stageWidth, width).forEach((x, i) => {
      const now = state[i];
      if (now) now.home = x;
      if (phase === 'reading') place(i, x);
    });
    // A resize mid-finale keeps the cast where the finale has them.
    if (phase === 'gathered' && !motion.matches) {
      gatheredPositions(actors.length, stageWidth, width).forEach((x, i) => place(i, x));
    } else if (phase === 'gone') {
      exitPositions(actors.length, stageWidth).forEach((x, i) => place(i, x));
    }
  }

  function update() {
    fill.style.transform = `scaleX(${Math.min(1, scrollY / maxScroll)})`;
    if (phase !== 'reading') {
      if (end.getBoundingClientRect().top > innerHeight * 0.95) {
        resetFinale();
        update();
      }
      return;
    }
    actors.forEach(({ slot, mention }, i) => {
      const now = state[i];
      const passed = mention.getBoundingClientRect().top < trigger;
      if (!now || passed === now.passed) return;
      now.passed = passed;
      slot.classList.toggle('passed', passed);
      slot.classList.toggle('in', passed);
    });
    if (end.getBoundingClientRect().top < innerHeight * 0.7) curtainCall();
  }

  function walk(i: number, x: number): number {
    const actor = actors[i];
    const now = state[i];
    if (!actor || !now) return 0;
    const ms = walkDuration(x - now.x, between(0.15, 0.18));
    actor.slot.classList.add('walking');
    place(i, x, ms);
    later(() => {
      actor.slot.classList.remove('walking');
      actor.art.classList.remove('facing-left');
    }, ms);
    return ms;
  }

  function curtainCall() {
    phase = 'gathered';
    actors.forEach(({ slot }, i) => {
      const now = state[i];
      if (now) now.passed = true;
      slot.classList.add('passed', 'in');
    });
    if (motion.matches) return;

    // 1. Gather centre stage. The dots fade, since the line no longer maps to the text.
    actors.forEach(({ slot }) => slot.classList.add('offstage'));
    const gathered = gatheredPositions(actors.length, stageWidth, castWidth());
    const walkTime = Math.max(...gathered.map((x, i) => walk(i, x)));

    // 2. Bow from the hips, a little out of step, like real actors.
    const bowAt = walkTime + 250;
    actors.forEach(({ slot }, i) => {
      later(() => slot.classList.add('bow'), bowAt + i * 90 + between(0, 70));
    });
    later(() => actors.forEach(({ slot }) => slot.classList.remove('bow')), bowAt + 1300);

    // 3. Walk off stage right, the one nearest the wing first. Once off stage they can't take focus.
    later(() => {
      phase = 'gone';
      const exits = exitPositions(actors.length, stageWidth);
      for (let i = actors.length - 1, order = 0; i >= 0; i--, order++) {
        const actor = i;
        later(() => {
          const ms = walk(actor, exits[actor] ?? stageWidth);
          later(() => {
            const slot = actors[actor]?.slot;
            if (slot) slot.inert = true;
          }, ms);
        }, order * 180);
      }
    }, bowAt + 1800);
  }

  // Puts the cast back where reading left them, with nothing running.
  function resetFinale() {
    curtainTimers.forEach(clearTimeout);
    curtainTimers.clear();
    phase = 'reading';
    actors.forEach(({ slot, art }, i) => {
      const now = state[i];
      slot.classList.remove('walking', 'bow', 'in', 'passed', 'offstage');
      slot.inert = false;
      art.classList.remove('facing-left');
      if (now) {
        now.passed = false;
        place(i, now.home);
      }
    });
  }

  const onScroll = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };
  const onLayoutChange = () => {
    layout();
    update();
  };

  actors.forEach(({ slot }) => {
    slot.style.setProperty('--hop-duration', `${Math.round(between(380, 560))}ms`);
  });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onLayoutChange);
  // A page can change height with no resize, such as lazy content loading or a return from bfcache.
  addEventListener('pageshow', onLayoutChange);
  const pageSize = new ResizeObserver(onLayoutChange);
  pageSize.observe(document.documentElement);
  layout();
  update();

  return {
    jumpTo(index) {
      const mention = actors[index]?.mention;
      if (!mention) return;
      mention.scrollIntoView({ block: 'center' });
      // Move focus too, so a keyboard or screen-reader user's position follows the jump.
      mention.tabIndex = -1;
      mention.focus({ preventScroll: true });
      mention.classList.add('flash');
      later(() => mention.classList.remove('flash'), 1400, flashTimers);
    },
    replay() {
      resetFinale();
      // Commit the reset, so the cast walks from where it was placed, facing the right way.
      void stage.offsetWidth;
      curtainCall();
    },
    destroy() {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onLayoutChange);
      removeEventListener('pageshow', onLayoutChange);
      pageSize.disconnect();
      cancelAnimationFrame(frame);
      [curtainTimers, flashTimers].forEach((timers) => {
        timers.forEach(clearTimeout);
        timers.clear();
      });
    },
  };
}
