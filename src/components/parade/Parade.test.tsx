import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Parade } from './Parade';

let reducedMotion = false;

beforeEach(() => {
  reducedMotion = false;
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
  document.body.innerHTML = `
    <span id="cast-cat">Cat</span>
    <span id="cast-rabbit">Rabbit</span>
    <p id="end"></p>`;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => vi.unstubAllGlobals());

const renderParade = () =>
  render(<Parade cast={['cat', 'rabbit']} endId="end" />, {
    container: document.body.appendChild(document.createElement('div')),
  });

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

  it('jumps to a cast member’s first mention and highlights it', async () => {
    renderParade();
    await userEvent.click(screen.getByRole('button', { name: /The White Rabbit/ }));
    const mention = document.getElementById('cast-rabbit');
    expect(mention?.scrollIntoView).toHaveBeenCalled();
    expect(mention).toHaveClass('flash');
  });

  it('runs the curtain call on replay, walking the cast', async () => {
    renderParade();
    await userEvent.click(screen.getByRole('button', { name: 'Replay the curtain call' }));
    expect(screen.getByRole('button', { name: /The White Rabbit/ })).toHaveClass('walking');
  });

  it('shows the still state under reduced motion: nothing walks', async () => {
    reducedMotion = true;
    renderParade();
    await userEvent.click(screen.getByRole('button', { name: 'Replay the curtain call' }));
    const rabbit = screen.getByRole('button', { name: /The White Rabbit/ });
    expect(rabbit).not.toHaveClass('walking');
    expect(rabbit).toHaveClass('in');
  });

  it('stops listening when it’s removed', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    renderParade().unmount();
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
