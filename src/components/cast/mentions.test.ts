import { describe, expect, it } from 'vitest';
import { castInOrderOfAppearance } from './mentions';

describe('castInOrderOfAppearance', () => {
  it('orders the cast by where each is first mentioned', () => {
    const body = 'a <span id="cast-press">Press</span> b <span id="cast-paper">Paper</span>';
    expect(castInOrderOfAppearance(body, ['paper', 'press'])).toEqual(['press', 'paper']);
  });

  it('fails when a listed cast member has no mention', () => {
    expect(() => castInOrderOfAppearance('no spans', ['milk'])).toThrow('"milk" has no mention');
  });

  it.each([
    ['a code span', '<code>&lt;span id="cast-milk"&gt;</code>'],
    ['a comment', '<!-- <span id="cast-milk">Milk</span> -->'],
    ['another attribute', '<span data-id="cast-milk">Milk</span>'],
  ])('doesn’t count a marker in %s', (_, html) => {
    expect(() => castInOrderOfAppearance(html, ['milk'])).toThrow('"milk" has no mention');
  });

  it('accepts either kind of quote', () => {
    expect(castInOrderOfAppearance("<span id='cast-milk'>Milk</span>", ['milk'])).toEqual(['milk']);
  });

  it('fails when a cast member is marked twice', () => {
    const body = '<span id="cast-press">Press</span> <span id="cast-press">Press</span>';
    expect(() => castInOrderOfAppearance(body, ['press'])).toThrow('more than one mention');
  });
});
