// The Mermaid text for each chart idea, generated from the run so the floor can't drift from it. Each chart
// also carries a plain list of the same content, for the visually hidden list beside its visual (S16).
import type { Run, RunAgent, RunStage } from './run';

export type RunChartId = 'fan-out' | 'spin-up' | 'narrowing';

export interface RunChart {
  id: RunChartId;
  title: string;
  /** The Mermaid source. */
  text: string;
  /** The labels a reader sees, to check against the rendered SVG. */
  labels: string[];
  /** The same content as sentences. */
  list: string[];
}

const escapeLabel = (label: string) =>
  label
    .replace(/#/g, '#35;')
    .replace(/&/g, '#amp;')
    .replace(/"/g, '#quot;')
    .replace(/</g, '#lt;')
    .replace(/>/g, '#gt;');

class Flowchart {
  readonly labels: string[] = [];

  /** A node's Mermaid text, remembering its label. */
  node(id: string, label: string): string {
    this.labels.push(label);
    // Notes go on a second line, so a chart stays narrow enough to read on a phone.
    return `${id}["${escapeLabel(label).replace(' (', '<br/>(')}"]`;
  }
}

const stageLabel = ({ name, optional }: RunStage) => (optional ? `${name} (optional)` : name);

export function agentLabel({ name, count, optional }: RunAgent): string {
  const notes = [
    ...(count.min === count.max ? [] : [`${count.min}–${count.max}`]),
    ...(optional ? ['optional'] : []),
  ];
  const times = count.default === 1 && !notes.length ? '' : ` ×${count.default}`;
  return `${name}${times}${notes.length ? ` (${notes.join(', ')})` : ''}`;
}

function agentSentence({ name, count, optional }: RunAgent): string {
  const howMany =
    count.min !== count.max
      ? `, ${count.default} by default, ${count.min} to ${count.max}`
      : count.default === 1
        ? ''
        : `, ${count.default} of them`;
  return `${name}${howMany}${optional ? ', optional' : ''}`;
}

function fanOut(run: Run): RunChart {
  const chart = new Flowchart();
  const lines = [`  ${chart.node('orchestrator', run.orchestrator)}`];
  for (const stage of run.stages) {
    const id = `stage-${stage.id}`;
    lines.push(`  orchestrator --> ${chart.node(id, stageLabel(stage))}`);
    for (const agent of stage.agents) {
      lines.push(`  ${id} --> ${chart.node(`agent-${agent.id}`, agentLabel(agent))}`);
    }
  }
  return {
    id: 'fan-out',
    title: 'The fan-out: which agents each stage starts',
    text: ['flowchart LR', ...lines].join('\n'),
    labels: chart.labels,
    list: run.stages.map((stage) => {
      const name = stage.optional ? `${stage.name}, optional` : stage.name;
      const agents = stage.agents.map(agentSentence).join(' and ');
      return `${run.orchestrator} starts ${name}, which runs ${agents}.`;
    }),
  };
}

const usualAgents = ({ agents }: RunStage) =>
  agents.reduce((total, { count }) => total + count.default, 0);

function spinUp(run: Run): RunChart {
  const chart = new Flowchart();
  const lines: string[] = [];
  run.stages.forEach((stage, i) => {
    const count = usualAgents(stage);
    const upLabel =
      count === 1 ? `${stage.name}: 1 agent spins up` : `${stage.name}: ${count} agents spin up`;
    const downLabel = `${stage.name}: ${count === 1 ? 'it spins' : 'they spin'} down`;
    const previous = run.stages[i - 1];
    const up = chart.node(`up-${stage.id}`, upLabel);
    const down = chart.node(`down-${stage.id}`, downLabel);
    if (previous) lines.push(`  down-${previous.id} --> ${up}`);
    lines.push(`  ${previous ? `up-${stage.id}` : up} --> ${down}`);
  });
  return {
    id: 'spin-up',
    title: 'The spin-up: agents start and stop, stage by stage',
    text: ['flowchart TD', ...lines].join('\n'),
    labels: chart.labels,
    list: run.stages.map((stage) => {
      const count = usualAgents(stage);
      return count === 1
        ? `${stage.name}: 1 agent spins up, then spins down.`
        : `${stage.name}: ${count} agents spin up, then spin down.`;
    }),
  };
}

function narrowing(run: Run): RunChart {
  const chart = new Flowchart();
  const lines: string[] = [];
  const stages = run.stages.filter(({ cards }) => cards > 0);
  const cardsLabel = ({ name, cards }: RunStage) =>
    `${name}: ${cards} ${cards === 1 ? 'card' : 'cards'}`;
  stages.forEach((stage, i) => {
    const next = stages[i + 1];
    const from = i === 0 ? chart.node(`cards-${stage.id}`, cardsLabel(stage)) : `cards-${stage.id}`;
    const to = next
      ? chart.node(`cards-${next.id}`, cardsLabel(next))
      : chart.node('menu', 'The menu');
    lines.push(`  ${from} --> ${to}`);
  });
  for (const card of run.cards) {
    lines.push(`  menu --> ${chart.node(`card-${card.id}`, card.name)}`);
  }
  return {
    id: 'narrowing',
    title: 'The narrowing: cards go down to the menu',
    text: ['flowchart TD', ...lines].join('\n'),
    labels: chart.labels,
    list: [
      ...stages.map((stage) => `${cardsLabel(stage)}.`),
      `The menu: ${run.cards.map(({ name }) => name).join(', ')}.`,
    ],
  };
}

export function runCharts(run: Run): RunChart[] {
  return [fanOut(run), spinUp(run), narrowing(run)];
}
