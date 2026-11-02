import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { PieceCard } from './PieceCard';

it('is one link to its piece, with the piece’s title as a heading', () => {
  render(
    <PieceCard
      href="/skill/essays/a/"
      slug="a"
      kicker="Essay"
      title="A title"
      dek="A dek"
      cast={['cat']}
    />,
  );
  expect(screen.getByRole('link')).toHaveAttribute('href', '/skill/essays/a/');
  expect(screen.getByRole('heading', { level: 2, name: 'A title' })).toBeInTheDocument();
});

it('has no empty space for a cast when the piece has none', () => {
  const { container } = render(
    <PieceCard
      href="/skill/write-ups/a/"
      slug="a"
      kicker="Write-up"
      title="A title"
      dek="A dek"
      cast={[]}
    />,
  );
  expect(container.querySelector('.piece-card-cast')).not.toBeInTheDocument();
});
