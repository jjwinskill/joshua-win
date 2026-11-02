import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { run } from '../../lib/run-file';
import { nearestTurn, panelPose } from './umbrella-pose';
import { UmbrellaCarousel } from './UmbrellaCarousel';

const stubMotion = (reduced: boolean) => vi.stubGlobal('matchMedia', () => ({ matches: reduced }));

beforeEach(() => stubMotion(true));
afterEach(() => vi.unstubAllGlobals());

const openness = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('.umbrella-panel')].map((panel) =>
    Number(panel.style.getPropertyValue('--open')),
  );

it('hides the visual, keeps real buttons outside it, and lists the same fan-out', () => {
  const { container } = render(<UmbrellaCarousel run={run} />);
  const visual = container.querySelector('[aria-hidden="true"]');
  expect(visual).toBeInTheDocument();
  expect(visual?.querySelector('button')).toBeNull();
  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(run.stages.length);
  expect(buttons.map((button) => button.textContent)).toEqual(run.stages.map(({ name }) => name));
  const items = screen.getAllByRole('listitem');
  expect(items).toHaveLength(run.stages.length);
  for (const agent of run.stages[1]?.agents ?? []) expect(items[1]).toHaveTextContent(agent.name);
});

it('starts with the first panel open, and clicking expands only the one clicked', async () => {
  const user = userEvent.setup();
  const { container } = render(<UmbrellaCarousel run={run} />);
  expect(openness(container)).toEqual([1, 0, 0, 0]);
  expect(screen.getByRole('button', { name: run.stages[0]?.name })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await user.click(screen.getByRole('button', { name: run.stages[2]?.name }));
  expect(openness(container)).toEqual([0, 0, 1, 0]);
  expect(screen.getByRole('button', { name: run.stages[0]?.name })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  expect(screen.getByRole('button', { name: run.stages[2]?.name })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

it('stops its spring when unmounted', async () => {
  stubMotion(false);
  const cancel = vi.spyOn(window, 'cancelAnimationFrame');
  const user = userEvent.setup();
  const { unmount } = render(<UmbrellaCarousel run={run} />);
  await user.click(screen.getByRole('button', { name: run.stages[1]?.name }));
  cancel.mockClear();
  unmount();
  expect(cancel).toHaveBeenCalled();
});

it('puts the chosen panel at the front, biggest and nearest', () => {
  const front = panelPose(2, 2, 5);
  expect(front).toMatchObject({ x: 50, scale: 1, twist: 0, open: 1 });
  for (const i of [0, 1, 3, 4]) {
    const other = panelPose(i, 2, 5);
    expect(other.open).toBe(0);
    expect(other.scale).toBeLessThan(1);
    expect(other.depth).toBeLessThan(front.depth);
  }
});

it('never turns a panel past facing the reader, so no text reads mirrored', () => {
  for (let turn = 0; turn < 4; turn += 0.07) {
    expect(Math.abs(panelPose(1, turn, 4).twist)).toBeLessThanOrEqual(32);
  }
});

it('moves smoothly as a panel passes the back', () => {
  const before = panelPose(0, 1.99, 4);
  const after = panelPose(0, 2.01, 4);
  expect(Math.abs(before.x - after.x)).toBeLessThan(2);
  expect(Math.abs(before.twist - after.twist)).toBeLessThan(2);
});

it('goes the short way round', () => {
  expect(nearestTurn(0, 3, 4)).toBe(-1);
  expect(nearestTurn(0, 1, 4)).toBe(1);
  expect(nearestTurn(-1, 0, 4)).toBe(0);
  expect(nearestTurn(5, 1, 4)).toBe(5);
});

it('copes with a run of one stage', () => {
  expect(panelPose(0, 0, 1)).toMatchObject({ open: 1, scale: 1 });
  expect(nearestTurn(0, 0, 1)).toBe(0);
});
