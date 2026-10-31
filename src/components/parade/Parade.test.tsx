import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Parade } from './Parade';

let reducedMotion = false;

// jsdom has no layout, so everything would sit at the top of the page and start the curtain call on
// mount. This puts the mentions and the end of the piece far below the fold.
function belowTheFold(id: string) {
  const el = document.getElementById(id);
  if (el) el.getBoundingClientRect = () => ({ top: 10_000 }) as DOMRect;
}

beforeEach(() => {
  reducedMotion = false;
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn();
      disconnect = vi.fn();
    },
  );
  document.body.innerHTML = `
    <span id="cast-cat">Cat</span>
    <span id="cast-rabbit">Rabbit</span>
    <p id="end"></p>`;
  ['cast-cat', 'cast-rabbit', 'end'].forEach(belowTheFold);
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => vi.unstubAllGlobals());

const renderParade = () =>
  render(<Parade cast={['cat', 'rabbit']} endId="end" />, {
    container: document.body.appendChild(document.createElement('div')),
  });

const rabbit = () => screen.getByRole('button', { name: /The White Rabbit/ });
const replay = () => screen.getByRole('button', { name: 'Replay the curtain call' });

describe('Parade', () => {
  it('gives each cast member a named button, in the given order', () => {
    renderParade();
    const names = screen
      .getAllByRole('button', { name: /first appearance/ })
      .map((button) => button.getAttribute('aria-label'));
    expect(names).toEqual([
      'The Cheshire Cat: jump to their first appearance',
      'The White Rabbit: jump to their first appearance',
    ]);
  });

  it('jumps to a cast member’s first mention, moves focus there and highlights it', async () => {
    renderParade();
    await userEvent.click(rabbit());
    const mention = document.getElementById('cast-rabbit');
    expect(mention?.scrollIntoView).toHaveBeenCalled();
    expect(mention).toHaveFocus();
    expect(mention).toHaveClass('flash');
  });

  it('stays still until the curtain call, and replay walks the cast', async () => {
    renderParade();
    expect(rabbit()).not.toHaveClass('walking');
    await userEvent.click(replay());
    expect(rabbit()).toHaveClass('walking');
    expect(replay()).toHaveFocus();
  });

  it('shows the still state under reduced motion: everyone appears and nothing walks', async () => {
    reducedMotion = true;
    renderParade();
    expect(rabbit()).not.toHaveClass('in');
    await userEvent.click(replay());
    expect(rabbit()).toHaveClass('in');
    expect(rabbit()).not.toHaveClass('walking');
  });

  it('stops listening when it’s removed', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    renderParade().unmount();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
