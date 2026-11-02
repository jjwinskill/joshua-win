import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CastList } from './CastList';

const citedWork = { title: 'A Cited Work', author: 'An Author' };

describe('CastList', () => {
  it('makes each card one link to that cast member’s first mention, in the given order', () => {
    render(<CastList cast={['press', 'paper']} citedWork={citedWork} />);
    const links = within(screen.getByRole('list')).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#cast-press', '#cast-paper']);
    expect(links[0]).toHaveAccessibleName(/The giant new hydraulic press at Bubny/);
  });

  it('names the cited work', () => {
    render(<CastList cast={['press']} citedWork={citedWork} />);
    expect(screen.getByText('A Cited Work').tagName).toBe('CITE');
  });
});
