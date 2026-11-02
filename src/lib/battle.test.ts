import { expect, it } from 'vitest';
import { battleFrame, battleScript, battleState, nextStop } from './battle';
import { parseRun } from './run';
import { run } from './run-file';

const makeRun = (cards: number[], menu = cards.at(-1) ?? 1) =>
  parseRun({
    orchestrator: 'Boss',
    stages: cards.map((count, i) => ({
      id: `stage-${i}`,
      name: `Stage ${i}`,
      cards: count,
      agents: [{ id: `agent-${i}`, name: 'Agent', count: 1 }],
    })),
    cards: Array.from({ length: menu }, (_, i) => ({ id: `card-${i}`, name: `Card ${i}` })),
  });

it('each stop leaves the number of ideas the run file says, ending on the menu', () => {
  const script = battleScript(run);
  const stages = run.stages.filter(({ cards }) => cards > 0);
  expect(script.stops).toHaveLength(stages.length + 1);
  for (const [i, stage] of stages.entries()) {
    expect(battleState(script, script.stops[i] as number).left).toBe(stage.cards);
  }
  const end = battleState(script, script.total);
  expect(end.phase).toBe('menu');
  expect(end.left).toBe(run.cards.length);
});

it('ideas only ever go down once the fighting starts', () => {
  const script = battleScript(run);
  let left = script.ideaCount;
  for (let tick = script.introEnd; tick <= script.total; tick += 1) {
    const now = battleState(script, tick).left;
    expect(now).toBeLessThanOrEqual(left);
    left = now;
  }
});

it('a round knocks out exactly the ideas that don’t survive it', () => {
  const [round] = battleScript(run).rounds;
  expect(round?.survivors).toHaveLength(8);
  expect(round?.knockouts.size).toBe((round?.alive.length ?? 0) - 8);
  for (const survivor of round?.survivors ?? []) {
    expect(round?.knockouts.has(survivor)).toBe(false);
  }
});

it('stepping walks every stop, then goes back to the first', () => {
  const script = battleScript(run);
  let tick = 0;
  const seen = script.stops.map(() => (tick = nextStop(script, tick)));
  expect(seen).toEqual(script.stops);
  expect(nextStop(script, script.total)).toBe(script.stops[0]);
});

it('a tick always draws the same frame, and every tick draws something', () => {
  const script = battleScript(run);
  expect(battleFrame(script, 40)).toEqual(battleFrame(script, 40));
  for (let tick = 0; tick <= script.total; tick += 7) {
    expect(battleFrame(script, tick).length).toBeGreaterThan(0);
  }
  expect(battleFrame(script, 40)).not.toEqual(battleFrame(script, 41));
});

it('a tick past the end draws the still state', () => {
  const script = battleScript(run);
  expect(battleFrame(script, script.total + 50)).toEqual(battleFrame(script, script.total));
});

it.each([
  ['a run that never narrows', [3, 3]],
  ['one stage', [2]],
  ['a first stage with no cards', [0, 5, 2]],
  ['one card', [12, 1]],
  ['a big field', [60, 20, 4]],
])('copes with %s', (_, counts) => {
  const script = battleScript(makeRun(counts));
  for (let tick = 0; tick <= script.total; tick += 1) {
    const { left } = battleState(script, tick);
    expect(Number.isFinite(left)).toBe(true);
    expect(
      battleFrame(script, tick)
        .map(({ d }) => d)
        .join(''),
    ).not.toContain('NaN');
  }
  expect(battleState(script, script.total).left).toBe(counts.at(-1));
});

it('draws a name with letters it has no glyph for', () => {
  const named = parseRun({
    ...run,
    cards: [{ id: 'accented', name: 'Haňťa & co' }, ...run.cards.slice(1)],
  });
  const script = battleScript(named);
  expect(battleFrame(script, script.total).length).toBeGreaterThan(0);
});
