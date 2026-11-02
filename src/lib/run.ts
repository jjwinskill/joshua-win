// The run file's shape, and the check that a run file (src/content/run.json) is right. Every chart reads
// a checked run, so a bad file fails the build instead of a chart silently showing the wrong thing. The
// format expects change: stages and agents can be added or removed, a count can be a range, and either can
// be optional. Pure, so the render script and tests can use it outside a build.
export interface AgentCount {
  default: number;
  min: number;
  max: number;
}

export interface RunAgent {
  id: string;
  name: string;
  count: AgentCount;
  optional: boolean;
}

export interface RunStage {
  id: string;
  name: string;
  /** How many cards are left when this stage ends. */
  cards: number;
  optional: boolean;
  agents: RunAgent[];
}

export interface RunCard {
  id: string;
  name: string;
}

export interface Run {
  orchestrator: string;
  stages: RunStage[];
  /** The cards that reach the menu. */
  cards: RunCard[];
}

export class RunFileError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    const count = problems.length === 1 ? '1 problem' : `${problems.length} problems`;
    super(`The run file has ${count}:\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
    this.name = 'RunFileError';
    this.problems = problems;
  }
}

type Fields = Record<string, unknown>;

const isObject = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isWhole = (value: unknown): value is number => Number.isInteger(value);

class Checker {
  readonly problems: string[] = [];
  private readonly ids = new Set<string>();

  add(path: string, problem: string) {
    this.problems.push(`${path}: ${problem}`);
  }

  keys(fields: Fields, allowed: readonly string[], prefix: string) {
    for (const key of Object.keys(fields)) {
      if (!allowed.includes(key)) this.add(`${prefix}${key}`, 'isn’t a run file key');
    }
  }

  name(value: unknown, path: string): string {
    if (typeof value === 'string' && value.trim()) return value;
    this.add(path, 'must be a name that isn’t empty');
    return '';
  }

  id(value: unknown, path: string): string {
    if (typeof value !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
      this.add(path, 'must be lowercase letters, digits and hyphens');
      return '';
    }
    if (this.ids.has(value)) this.add(path, `"${value}" is already used`);
    this.ids.add(value);
    return value;
  }

  optional(value: unknown, path: string): boolean {
    if (value === undefined) return false;
    if (typeof value === 'boolean') return value;
    this.add(path, 'must be true or false');
    return false;
  }

  count(value: unknown, path: string): AgentCount {
    if (isWhole(value) && value > 0) return { default: value, min: value, max: value };
    if (
      isObject(value) &&
      isWhole(value.default) &&
      isWhole(value.min) &&
      isWhole(value.max) &&
      value.min > 0
    ) {
      const { default: usual, min, max } = value;
      if (min <= usual && usual <= max) return { default: usual, min, max };
      this.add(path, 'must have min <= default <= max');
      return { default: 1, min: 1, max: 1 };
    }
    this.add(path, 'must be a whole number above 0, or { default, min, max }');
    return { default: 1, min: 1, max: 1 };
  }

  list(value: unknown, path: string, item: string): unknown[] {
    if (Array.isArray(value) && value.length > 0) return value;
    this.add(path, `must be a list with at least one ${item}`);
    return [];
  }
}

function parseAgent(check: Checker, input: unknown, path: string): RunAgent | undefined {
  if (!isObject(input)) {
    check.add(path, 'must be an object');
    return undefined;
  }
  check.keys(input, ['id', 'name', 'count', 'optional'], `${path}.`);
  return {
    id: check.id(input.id, `${path}.id`),
    name: check.name(input.name, `${path}.name`),
    count: check.count(input.count, `${path}.count`),
    optional: check.optional(input.optional, `${path}.optional`),
  };
}

function parseStage(check: Checker, input: unknown, path: string): RunStage | undefined {
  if (!isObject(input)) {
    check.add(path, 'must be an object');
    return undefined;
  }
  check.keys(input, ['id', 'name', 'cards', 'optional', 'agents'], `${path}.`);
  const id = check.id(input.id, `${path}.id`);
  const name = check.name(input.name, `${path}.name`);
  const { cards } = input;
  if (!isWhole(cards) || cards < 0)
    check.add(`${path}.cards`, 'must be a whole number, 0 or above');
  const agents = check
    .list(input.agents, `${path}.agents`, 'agent')
    .flatMap((agent, i) => parseAgent(check, agent, `${path}.agents[${i}]`) ?? []);
  return {
    id,
    name,
    cards: isWhole(cards) ? cards : 0,
    optional: check.optional(input.optional, `${path}.optional`),
    agents,
  };
}

function parseCard(check: Checker, input: unknown, path: string): RunCard | undefined {
  if (!isObject(input)) {
    check.add(path, 'must be an object');
    return undefined;
  }
  check.keys(input, ['id', 'name'], `${path}.`);
  return { id: check.id(input.id, `${path}.id`), name: check.name(input.name, `${path}.name`) };
}

/** Checks a run file's contents, and throws a RunFileError listing everything wrong with it. */
export function parseRun(input: unknown): Run {
  const check = new Checker();
  if (!isObject(input)) {
    check.add('run', 'must be an object');
    throw new RunFileError(check.problems);
  }
  check.keys(input, ['orchestrator', 'stages', 'cards'], '');
  const orchestrator = check.name(input.orchestrator, 'orchestrator');
  const stages = check
    .list(input.stages, 'stages', 'stage')
    .flatMap((stage, i) => parseStage(check, stage, `stages[${i}]`) ?? []);
  const cards = check
    .list(input.cards, 'cards', 'card')
    .flatMap((card, i) => parseCard(check, card, `cards[${i}]`) ?? []);
  const last = stages.at(-1);
  stages.forEach((stage, i) => {
    // Early stages may have made no cards yet, so 0 doesn't count.
    const previous = stages.slice(0, i).findLast(({ cards }) => cards > 0);
    if (previous && stage.cards > previous.cards) {
      check.add(
        `stages[${i}].cards`,
        `can't rise from ${previous.cards}: stages only narrow cards`,
      );
    }
  });
  if (last && cards.length > 0 && last.cards !== cards.length) {
    check.add(
      `stages[${stages.length - 1}].cards`,
      `the last stage must end with the ${cards.length} listed cards, not ${last.cards}`,
    );
  }
  if (check.problems.length > 0) throw new RunFileError(check.problems);
  return { orchestrator, stages, cards };
}
