import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Greeting } from './Greeting';

describe('Greeting', () => {
  it('shows the heading as the page heading', () => {
    render(<Greeting heading="Lorem ipsum" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Lorem ipsum' })).toBeInTheDocument();
  });

  it('renders its children below the heading', () => {
    render(
      <Greeting heading="Lorem ipsum">
        <p>Dolor sit amet</p>
      </Greeting>,
    );
    expect(screen.getByText('Dolor sit amet')).toBeInTheDocument();
  });
});
