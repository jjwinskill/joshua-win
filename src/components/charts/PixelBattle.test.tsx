import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { run } from '../../lib/run-file';
import { PixelBattle } from './PixelBattle';

let seen: ((entries: { isIntersecting: boolean }[]) => void) | undefined;
const disconnect = vi.fn();

function stubBrowser(reduced = false) {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: typeof seen) {
        seen = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  vi.stubGlobal('matchMedia', () => ({
    matches: reduced,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

const drawing = (container: HTMLElement) =>
  [...container.querySelectorAll('svg path')].map((path) => path.getAttribute('d')).join();

beforeEach(() => {
  stubBrowser();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  disconnect.mockClear();
});

it('hides the visual, keeps real buttons outside it, and lists the narrowing', () => {
  const { container } = render(<PixelBattle run={run} />);
  const visual = container.querySelector('svg');
  expect(visual).toHaveAttribute('aria-hidden', 'true');
  expect(visual?.querySelector('button')).toBeNull();
  expect(screen.getByRole('button', { name: 'Start over' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Play again' })).toBeEnabled();
  const items = screen.getAllByRole('listitem');
  expect(items.at(-1)).toHaveTextContent(/The menu: Card one, Card two, Card three/);
  expect(screen.getByRole('figure')).toHaveTextContent(/down to the menu/);
});

it('renders its still state on the server, so there’s a menu before it hydrates', () => {
  const html = renderToString(<PixelBattle run={run} />);
  expect(html).toMatch(/<path[^>]+d="M/);
});

it('starts when first seen, and a tick later draws something new', () => {
  const { container } = render(<PixelBattle run={run} />);
  const still = drawing(container);
  act(() => seen?.([{ isIntersecting: true }]));
  const first = drawing(container);
  expect(first).not.toBe(still);
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(drawing(container)).not.toBe(first);
});

it('pauses, and stays paused', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
  const { container } = render(<PixelBattle run={run} />);
  act(() => seen?.([{ isIntersecting: true }]));
  await user.click(screen.getByRole('button', { name: 'Pause' }));
  const paused = drawing(container);
  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(drawing(container)).toBe(paused);
  expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
});

it('stops off screen, and picks up where it left off', () => {
  const { container } = render(<PixelBattle run={run} />);
  act(() => seen?.([{ isIntersecting: true }]));
  act(() => {
    vi.advanceTimersByTime(500);
  });
  act(() => seen?.([{ isIntersecting: false }]));
  const away = drawing(container);
  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(drawing(container)).toBe(away);
  act(() => seen?.([{ isIntersecting: true }]));
  act(() => {
    vi.advanceTimersByTime(200);
  });
  expect(drawing(container)).not.toBe(away);
});

it('ends on the menu, and offers to play again', () => {
  render(<PixelBattle run={run} />);
  act(() => seen?.([{ isIntersecting: true }]));
  act(() => {
    vi.advanceTimersByTime(60_000);
  });
  expect(screen.getByRole('button', { name: 'Play again' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Start over' })).toBeInTheDocument();
});

it('clears its timer and observer when unmounted', () => {
  const clear = vi.spyOn(globalThis, 'clearInterval');
  const { unmount } = render(<PixelBattle run={run} />);
  act(() => seen?.([{ isIntersecting: true }]));
  clear.mockClear();
  unmount();
  expect(clear).toHaveBeenCalled();
  expect(disconnect).toHaveBeenCalled();
});

it('under reduced motion, it stays on the menu and a button snaps between rounds', async () => {
  stubBrowser(true);
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
  const { container } = render(<PixelBattle run={run} />);
  const still = drawing(container);
  act(() => seen?.([{ isIntersecting: true }]));
  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(drawing(container)).toBe(still);
  expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Start over' }));
  const round = drawing(container);
  expect(round).not.toBe(still);
  act(() => {
    vi.advanceTimersByTime(2000);
  });
  expect(drawing(container)).toBe(round);
  expect(screen.getByRole('button', { name: 'Next round' })).toBeInTheDocument();
});

it('turning on reduced motion mid-play stops it on the menu', () => {
  let reduce = false;
  let notify = () => {};
  stubBrowser();
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return reduce;
    },
    addEventListener: (_: string, listener: () => void) => {
      notify = listener;
    },
    removeEventListener: () => {},
  }));
  const { container } = render(<PixelBattle run={run} />);
  const menu = drawing(container);
  act(() => seen?.([{ isIntersecting: true }]));
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(drawing(container)).not.toBe(menu);
  act(() => {
    reduce = true;
    notify();
  });
  expect(drawing(container)).toBe(menu);
  expect(screen.queryByRole('button', { name: 'Pause' })).toBeNull();
});
