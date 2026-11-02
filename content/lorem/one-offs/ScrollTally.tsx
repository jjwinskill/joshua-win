// A one-off for lorem piece 3: an inline word in the prose that says how far down the page the reader is.
// It exists to settle S15, so it's small: it hydrates inside a sentence, and it listens to the page, so
// there's something to clean up across a page swap. No props. Before hydrating, and with no JavaScript, it
// reads "some", so the sentence still makes sense.
import { useSyncExternalStore } from 'react';

const beforeHydrating = 'some';

export function percentRead(scrolled: number, viewport: number, page: number): string {
  const distance = page - viewport;
  if (distance <= 0) return '100%';
  return `${Math.round(Math.min(Math.max(scrolled / distance, 0), 1) * 100)}%`;
}

function subscribe(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}

const read = () =>
  percentRead(window.scrollY, window.innerHeight, document.documentElement.scrollHeight);

export function ScrollTally() {
  const text = useSyncExternalStore(subscribe, read, () => beforeHydrating);
  // The fixed width and tabular digits stop a changing number from rewrapping the paragraph.
  return (
    <span
      className="scroll-tally"
      style={{ display: 'inline-block', minWidth: '4ch', fontVariantNumeric: 'tabular-nums' }}
    >
      {text}
    </span>
  );
}
