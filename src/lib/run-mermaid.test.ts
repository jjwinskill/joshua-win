import { expect, it } from 'vitest';
import { parseRun } from './run';
import { runCharts } from './run-mermaid';

const run = parseRun({
  orchestrator: 'Conductor',
  stages: [
    {
      id: 'first',
      name: 'First',
      cards: 6,
      agents: [
        { id: 'a', name: 'Agent A', count: 1 },
        { id: 'b', name: 'Agent "B"', count: { default: 3, min: 1, max: 5 }, optional: true },
      ],
    },
    { id: 'setup', name: 'Setup', cards: 0, agents: [{ id: 'c', name: 'Agent C', count: 2 }] },
    {
      id: 'last',
      name: 'Last',
      cards: 2,
      optional: true,
      agents: [{ id: 'd', name: 'Agent D', count: 1 }],
    },
  ],
  cards: [
    { id: 'x', name: 'Card X' },
    { id: 'y', name: 'Card Y' },
  ],
});

const chart = (id: string) => {
  const found = runCharts(run).find((candidate) => candidate.id === id);
  if (!found) throw new Error(`No chart ${id}`);
  return found;
};

it('makes one chart per chart idea', () => {
  expect(runCharts(run).map(({ id }) => id)).toEqual(['fan-out', 'spin-up', 'narrowing']);
});

it('the fan-out goes from the orchestrator to each stage to each agent, with its count', () => {
  expect(chart('fan-out').text).toBe(
    [
      'flowchart LR',
      '  orchestrator["Conductor"]',
      '  orchestrator --> stage-first["First"]',
      '  stage-first --> agent-a["Agent A"]',
      '  stage-first --> agent-b["Agent #quot;B#quot; ×3<br/>(1–5, optional)"]',
      '  orchestrator --> stage-setup["Setup"]',
      '  stage-setup --> agent-c["Agent C ×2"]',
      '  orchestrator --> stage-last["Last<br/>(optional)"]',
      '  stage-last --> agent-d["Agent D"]',
    ].join('\n'),
  );
});

it('the spin-up chart shows each stage’s agents spinning up, then down, in order', () => {
  expect(chart('spin-up').text).toBe(
    [
      'flowchart TD',
      '  up-first["First: 4 agents spin up"] --> down-first["First: they spin down"]',
      '  down-first --> up-setup["Setup: 2 agents spin up"]',
      '  up-setup --> down-setup["Setup: they spin down"]',
      '  down-setup --> up-last["Last: 1 agent spins up"]',
      '  up-last --> down-last["Last: it spins down"]',
    ].join('\n'),
  );
});

it('the narrowing chart skips stages with no cards, and ends at the menu', () => {
  expect(chart('narrowing').text).toBe(
    [
      'flowchart TD',
      '  cards-first["First: 6 cards"] --> cards-last["Last: 2 cards"]',
      '  cards-last --> menu["The menu"]',
      '  menu --> card-x["Card X"]',
      '  menu --> card-y["Card Y"]',
    ].join('\n'),
  );
});

it('gives each chart a title and a plain list of the same content', () => {
  expect(chart('fan-out').title).toBeTruthy();
  expect(chart('fan-out').list).toEqual([
    'Conductor starts First, which runs Agent A and Agent "B", 3 by default, 1 to 5, optional.',
    'Conductor starts Setup, which runs Agent C, 2 of them.',
    'Conductor starts Last, optional, which runs Agent D.',
  ]);
  expect(chart('spin-up').list[0]).toBe('First: 4 agents spin up, then spin down.');
  expect(chart('spin-up').list[2]).toBe('Last: 1 agent spins up, then spins down.');
  expect(chart('narrowing').list).toEqual([
    'First: 6 cards.',
    'Last: 2 cards.',
    'The menu: Card X, Card Y.',
  ]);
});

it('every label a reader sees is in the chart’s names', () => {
  expect(chart('fan-out').labels).toEqual(
    expect.arrayContaining(['Conductor', 'First', 'Agent A', 'Last (optional)']),
  );
  expect(chart('narrowing').labels).toEqual(
    expect.arrayContaining(['The menu', 'Card X', 'First: 6 cards']),
  );
});

it('escapes a label so it can’t break the chart', () => {
  const tricky = parseRun({
    orchestrator: 'A & B <c> #1',
    stages: [{ id: 's', name: 'S', cards: 1, agents: [{ id: 'a', name: 'A', count: 1 }] }],
    cards: [{ id: 'x', name: 'X' }],
  });
  expect(runCharts(tricky)[0]?.text).toContain('orchestrator["A #amp; B #lt;c#gt; #35;1"]');
});
