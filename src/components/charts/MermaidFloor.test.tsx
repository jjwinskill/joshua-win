import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { run } from '../../lib/run-file';
import { MermaidFloor } from './MermaidFloor';

it('hides the visual and gives a list of the same content, with a visible title', () => {
  const { container } = render(<MermaidFloor chart="fan-out" />);
  expect(container.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument();
  expect(screen.getByRole('figure')).toHaveTextContent(/The fan-out/);
  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(run.stages.length);
  for (const [i, stage] of run.stages.entries()) {
    expect(items[i]).toHaveTextContent(stage.name);
    for (const agent of stage.agents) expect(items[i]).toHaveTextContent(agent.name);
  }
});

it('renders every chart', () => {
  for (const chart of ['fan-out', 'spin-up', 'narrowing'] as const) {
    const { container, unmount } = render(<MermaidFloor chart={chart} />);
    expect(container.querySelector('svg')).toHaveAttribute('id', `run-chart-${chart}`);
    unmount();
  }
});
