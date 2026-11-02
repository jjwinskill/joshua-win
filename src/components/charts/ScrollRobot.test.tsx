import { render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { run } from '../../lib/run-file';
import { ScrollRobot } from './ScrollRobot';

it('hides the visual, and gives a list of the same story with a visible caption', () => {
  const { container } = render(<ScrollRobot run={run} />);
  expect(container.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument();
  expect(screen.getByRole('figure')).toHaveTextContent(/brain/);
  const items = screen.getAllByRole('listitem');
  expect(items[0]).toHaveTextContent(run.orchestrator);
  expect(items[1]).toHaveTextContent(/brain falls in.*snaps shut.*switches on/);
  for (const stage of run.stages) expect(items[2]).toHaveTextContent(stage.name);
});

it('has a lamp and a label for every stage, from the run it’s given', () => {
  const small = {
    ...run,
    orchestrator: 'Conductor',
    stages: run.stages.slice(0, 2),
  };
  const { container } = render(<ScrollRobot run={small} />);
  expect(container.querySelectorAll('.robot-lamp')).toHaveLength(2);
  const visual = within(container.querySelector('.robot') as HTMLElement);
  expect(visual.getByText('Conductor')).toBeInTheDocument();
  expect(visual.getByText(small.stages[1]?.name ?? '')).toBeInTheDocument();
});

it('needs no hydrating: it has nothing to focus and its markup is the finished robot', () => {
  const html = renderToString(<ScrollRobot run={run} />);
  expect(html).not.toMatch(/<(button|a|input)\b/);
  expect(html).toContain('robot-face-on');
  expect(html).toContain('robot-brain');
});
