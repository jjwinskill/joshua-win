import { expect, it } from 'vitest';
import { parseRun, RunFileError } from './run';

function at<T>(list: readonly T[], i: number): T {
  const item = list[i];
  if (item === undefined) throw new Error(`Nothing at ${i}`);
  return item;
}

const good = () => ({
  orchestrator: 'Conductor',
  stages: [
    {
      id: 'first',
      name: 'First',
      cards: 6,
      agents: [
        { id: 'a', name: 'Agent A', count: 2 },
        { id: 'b', name: 'Agent B', count: { default: 3, min: 1, max: 5 }, optional: true },
      ],
    },
    {
      id: 'last',
      name: 'Last',
      cards: 2,
      optional: true,
      agents: [{ id: 'c', name: 'Agent C', count: 1 }],
    },
  ],
  cards: [
    { id: 'x', name: 'Card X' },
    { id: 'y', name: 'Card Y' },
  ],
});

const problems = (input: unknown): string[] => {
  try {
    parseRun(input);
  } catch (error) {
    if (error instanceof RunFileError) return error.problems;
    throw error;
  }
  return [];
};

it('accepts a good run, and gives every count the same shape', () => {
  const run = parseRun(good());
  expect(run.stages[0]?.agents[0]?.count).toEqual({ default: 2, min: 2, max: 2 });
  expect(run.stages[0]?.agents[1]?.count).toEqual({ default: 3, min: 1, max: 5 });
  expect(run.stages[0]?.agents[1]?.optional).toBe(true);
  expect(run.stages[0]?.optional).toBe(false);
  expect(run.stages[1]?.optional).toBe(true);
});

it('accepts stages and agents being added or removed', () => {
  const run = good();
  run.stages.splice(0, 1);
  run.stages.push({
    id: 'extra',
    name: 'Extra',
    cards: 2,
    optional: false,
    agents: [
      { id: 'd', name: 'Agent D', count: 1 },
      { id: 'e', name: 'Agent E', count: 4 },
    ],
  });
  expect(parseRun(run).stages.map(({ id }) => id)).toEqual(['last', 'extra']);
});

it('says the error comes from the run file, and lists every problem at once', () => {
  const run = good();
  run.orchestrator = '';
  run.cards = [];
  expect(() => parseRun(run)).toThrow(/run file has 2 problems[\s\S]*orchestrator/);
  expect(problems(run)).toHaveLength(2);
});

it.each([
  ['not an object', () => 'nope', 'run: must be an object'],
  [
    'no stages',
    () => ({ ...good(), stages: [] }),
    'stages: must be a list with at least one stage',
  ],
  [
    'a stage with no agents',
    () => {
      const run = good();
      at(run.stages, 1).agents = [];
      return run;
    },
    'stages[1].agents: must be a list with at least one agent',
  ],
  [
    'a stage with a bad id',
    () => {
      const run = good();
      at(run.stages, 0).id = 'Has Spaces';
      return run;
    },
    'stages[0].id: must be lowercase letters, digits and hyphens',
  ],
  [
    'an id used twice',
    () => {
      const run = good();
      at(at(run.stages, 1).agents, 0).id = 'a';
      return run;
    },
    'stages[1].agents[0].id: "a" is already used',
  ],
  [
    'a stage and a card sharing an id',
    () => {
      const run = good();
      at(run.cards, 0).id = 'first';
      return run;
    },
    'cards[0].id: "first" is already used',
  ],
  [
    'a count that isn’t a whole number',
    () => {
      const run = good();
      at(at(run.stages, 0).agents, 0).count = 1.5;
      return run;
    },
    'stages[0].agents[0].count: must be a whole number above 0, or { default, min, max }',
  ],
  [
    'a default outside its range',
    () => {
      const run = good();
      at(at(run.stages, 0).agents, 1).count = { default: 9, min: 1, max: 5 };
      return run;
    },
    'stages[0].agents[1].count: must have min <= default <= max',
  ],
  [
    'a negative card count',
    () => {
      const run = good();
      at(run.stages, 0).cards = -1;
      return run;
    },
    'stages[0].cards: must be a whole number, 0 or above',
  ],
  [
    'optional that isn’t true or false',
    () => {
      const run = good();
      (run.stages[1] as { optional: unknown }).optional = 'yes';
      return run;
    },
    'stages[1].optional: must be true or false',
  ],
  ['a mistyped key', () => ({ ...good(), stagez: [] }), 'stagez: isn’t a run file key'],
  [
    'a last stage that doesn’t end on the listed cards',
    () => {
      const run = good();
      at(run.stages, 1).cards = 3;
      return run;
    },
    'stages[1].cards: the last stage must end with the 2 listed cards, not 3',
  ],
])('fails clearly on %s', (_name, make, expected) => {
  expect(problems(make())).toContain(expected);
});

it('fails when cards rise after a stage has made some, since stages only narrow them', () => {
  const rising = good();
  at(rising.stages, 0).cards = 1;
  expect(() => parseRun(rising)).toThrow(/stages\[1\]\.cards.*can't rise from 1/s);
});

it('lets cards rise from a first stage that made none', () => {
  const fromNone = good();
  at(fromNone.stages, 0).cards = 0;
  expect(() => parseRun(fromNone)).not.toThrow();
});
