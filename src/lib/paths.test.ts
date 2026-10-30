import { describe, expect, it } from 'vitest';
import { sitePath } from './paths';

describe('sitePath', () => {
  it('returns the base for the home page', () => {
    expect(sitePath('', '/skill/')).toBe('/skill/');
  });

  it('puts a relative path under the base', () => {
    expect(sitePath('essays/', '/skill/')).toBe('/skill/essays/');
  });

  it('keeps a leading slash from escaping the base', () => {
    expect(sitePath('/essays/', '/skill/')).toBe('/skill/essays/');
  });

  it('leaves the trailing slash to the caller, so files keep their names', () => {
    expect(sitePath('essays', '/skill/')).toBe('/skill/essays');
    expect(sitePath('og.png', '/skill/')).toBe('/skill/og.png');
  });

  it('copes with a base written without its trailing slash', () => {
    expect(sitePath('contents/', '/skill')).toBe('/skill/contents/');
  });
});
