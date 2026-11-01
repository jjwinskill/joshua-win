import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { percentRead, ScrollTally } from './ScrollTally';

it.each([
  [0, 1000, 3000, '0%'],
  [1000, 1000, 3000, '50%'],
  [2000, 1000, 3000, '100%'],
  // iOS can overscroll past either end.
  [-40, 1000, 3000, '0%'],
  [2100, 1000, 3000, '100%'],
  // A page that doesn't scroll has been read.
  [0, 1000, 800, '100%'],
])('at %d in a %d viewport on a %d page, it reads %s', (scrolled, viewport, page, expected) => {
  expect(percentRead(scrolled, viewport, page)).toBe(expected);
});

it('reads as a word in the sentence before hydrating', () => {
  expect(renderToString(<ScrollTally />)).toContain('>some<');
});

it('shows the percentage once mounted, and stops listening when unmounted', () => {
  const add = vi.spyOn(window, 'addEventListener');
  const remove = vi.spyOn(window, 'removeEventListener');
  const { unmount } = render(<ScrollTally />);
  expect(screen.getByText('100%')).toBeInTheDocument();
  const scrollAdds = add.mock.calls.filter(([type]) => type === 'scroll');
  expect(scrollAdds.length).toBeGreaterThan(0);
  unmount();
  const scrollRemoves = remove.mock.calls.filter(([type]) => type === 'scroll');
  expect(scrollRemoves.length).toBe(scrollAdds.length);
  vi.restoreAllMocks();
});
