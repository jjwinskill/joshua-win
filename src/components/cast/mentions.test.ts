import { describe, expect, it } from 'vitest';
import { castInOrderOfAppearance } from './mentions';

describe('castInOrderOfAppearance', () => {
  it('orders the cast by where each is first mentioned', () => {
    const body = 'a <span id="cast-cat">Cat</span> b <span id="cast-rabbit">Rabbit</span>';
    expect(castInOrderOfAppearance(body, ['rabbit', 'cat'])).toEqual(['cat', 'rabbit']);
  });

  it('fails when a listed cast member has no mention', () => {
    expect(() => castInOrderOfAppearance('no spans', ['queen'])).toThrow('"queen" has no mention');
  });

  it('fails when a cast member is marked twice', () => {
    const body = '<span id="cast-cat">Cat</span> <span id="cast-cat">Cat</span>';
    expect(() => castInOrderOfAppearance(body, ['cat'])).toThrow('more than one mention');
  });
});
