// The pixel-art battle's script and drawing (#56), as pure functions of the run and one number: which tick
// it is. Stepping, pausing, the still state and tests all come free from that. A frame is a few SVG paths,
// one per color, so it renders on the server too, and its still state (the last tick) is the menu.
import type { Run } from './run';

export const battleWidth = 160;
export const battleHeight = 156;
export const ticksPerSecond = 15;

const color = {
  floor: '#262b44',
  floorDot: '#3a4466',
  white: '#f4f4f4',
  dim: '#8b9bb4',
  gold: '#feae34',
  red: '#e43b44',
  shadow: '#0b0a12',
  box: '#181425',
  tints: ['#63c74d', '#2ce8f5', '#f77622', '#ff77a8', '#c0cbdc'],
};

// Art: `#` is the idea's tint, `o` its eye, `+` a highlight.
const ideaSprites = [
  ['........', '..####..', '.#+####.', '.#o##o#.', '########', '########', '#.##.##.', '........'],
  ['..####..', '.######.', '.#o##o#.', '.######.', '.######.', '.######.', '.######.', '.#.##.#.'],
  ['..####..', '.#+####.', '.#o##o#.', '.######.', '..####..', '...##...', '..++++..', '...++...'],
  ['...##...', '...##...', '########', '.#o##o#.', '..####..', '.######.', '.##..##.', '.#....#.'],
  ['.#....#.', '..####..', '.######.', '.#o##o#.', '.######.', '..#..#..', '.##..##.', '........'],
];

const orchestratorSprite = [
  '..g..gg..g..',
  '..gggggggg..',
  '..gggggggg..',
  '.+#########.',
  '.##o####o##.',
  '.##o####o##.',
  '.##########.',
  '.##rrrrrr##.',
  '..########..',
  '...#....#...',
  '..##....##..',
];

const glyphs: Record<string, string> = {
  A: '010101111101101',
  B: '110101110101110',
  C: '011100100100011',
  D: '110101101101110',
  E: '111100110100111',
  F: '111100110100100',
  G: '011100101101011',
  H: '101101111101101',
  I: '111010010010111',
  J: '001001001101010',
  K: '101101110101101',
  L: '100100100100111',
  M: '101111111101101',
  N: '110101101101101',
  O: '010101101101010',
  P: '110101110100100',
  Q: '010101101110011',
  R: '110101110101101',
  S: '011100010001110',
  T: '111010010010010',
  U: '101101101101111',
  V: '101101101101010',
  W: '101101111111101',
  X: '101101010101101',
  Y: '101101010010010',
  Z: '111001010100111',
  0: '111101101101111',
  1: '010110010010111',
  2: '110001010100111',
  3: '110001010001110',
  4: '101101111001001',
  5: '111100110001110',
  6: '011100111101111',
  7: '111001010010010',
  8: '010101010101010',
  9: '111101111001110',
  '!': '010010010000010',
  '?': '110001010000010',
  '>': '100010001010100',
  ':': '000010000010000',
  '.': '000000000000010',
  ',': '000000000010100',
  '-': '000000111000000',
  ' ': '000000000000000',
};

/** Keeps a number within a range. */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Steady pseudo-randomness, so a tick always draws the same frame. */
function hash(a: number, b = 0): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function plainText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

const textWidth = (text: string, scale: number) => text.length * 4 * scale - scale;

interface Point {
  x: number;
  y: number;
}

interface Group {
  survivor: number;
  members: number[];
}

interface Round {
  stage: string;
  alive: number[];
  survivors: number[];
  groups: Group[];
  /** The tick each loser is knocked out on. */
  knockouts: Map<number, number>;
  start: number;
  fightStart: number;
  clashStart: number;
  clashEnd: number;
  regroupStart: number;
  end: number;
}

export interface BattleScript {
  orchestrator: string;
  cards: string[];
  /** Each stage that has cards, and how many it leaves. */
  counts: { stage: string; cards: number }[];
  firstStage: string;
  ideaCount: number;
  introEnd: number;
  rounds: Round[];
  survivors: number[];
  menuStart: number;
  menuBoxEnd: number;
  menuMarchEnd: number;
  menuTextEnd: number;
  /** The last tick: the still state. */
  total: number;
  /** The ticks a reader can step between, ending on the menu. */
  stops: number[];
}

/** Turns a run into the battle's timing. Each stage that narrows the cards is a round. */
export function battleScript(run: Run): BattleScript {
  const counts = run.stages
    .filter(({ cards }) => cards > 0)
    .map(({ name, cards }) => ({ stage: name, cards }));
  const ideaCount = counts[0]?.cards ?? run.cards.length;
  const introEnd = Math.ceil(ideaCount * 0.7) + 10;
  let alive = Array.from({ length: ideaCount }, (_, i) => i);
  let tick = introEnd;
  const rounds: Round[] = [];
  for (const { stage, cards } of counts.slice(1)) {
    const groups: Group[] = Array.from({ length: cards }, () => ({ survivor: -1, members: [] }));
    alive.forEach((id, i) => groups[Math.floor((i * cards) / alive.length)]?.members.push(id));
    for (const [g, group] of groups.entries()) {
      const pick = Math.floor(hash(g, 3) * group.members.length);
      group.survivor = group.members[pick] ?? -1;
    }
    const survivors = groups.map(({ survivor }) => survivor);
    const losers = alive
      .filter((id) => !survivors.includes(id))
      .sort((a, b) => hash(a, 7) - hash(b, 7));
    const fightStart = tick + 13;
    const clashStart = fightStart + 8;
    const clashLength = clamp(8 + losers.length * 2, 12, 34);
    const clashEnd = clashStart + clashLength;
    const knockouts = new Map(
      losers.map((id, k) => [
        id,
        clashStart + 3 + Math.floor((k * (clashLength - 5)) / Math.max(losers.length - 1, 1)),
      ]),
    );
    // A beat of stillness after the last blow, then the survivors march to their new places.
    const regroupStart = clashEnd + 6;
    const end = regroupStart + 10;
    rounds.push({
      stage,
      alive,
      survivors,
      groups,
      knockouts,
      start: tick,
      fightStart,
      clashStart,
      clashEnd,
      regroupStart,
      end,
    });
    alive = survivors;
    tick = end;
  }
  const menuStart = tick + 6;
  const menuBoxEnd = menuStart + 6;
  const menuMarchEnd = menuBoxEnd + 10;
  const longest = Math.max(...run.cards.map(({ name }) => name.length));
  const menuTextEnd = menuMarchEnd + Math.ceil(longest / 2) + (run.cards.length - 1) * 4;
  const total = menuTextEnd + 8;
  return {
    orchestrator: run.orchestrator,
    cards: run.cards.map(({ name }) => name),
    counts,
    firstStage: counts[0]?.stage ?? '',
    ideaCount,
    introEnd,
    rounds,
    survivors: alive,
    menuStart,
    menuBoxEnd,
    menuMarchEnd,
    menuTextEnd,
    total,
    stops: [introEnd, ...rounds.map(({ end }) => end), total],
  };
}

/** The next stop after a tick, going back to the first after the menu. */
export function nextStop(script: BattleScript, tick: number): number {
  return script.stops.find((stop) => stop > tick) ?? script.stops[0] ?? script.total;
}

export type BattlePhase = 'intro' | 'announce' | 'fight' | 'regroup' | 'menu';

export interface BattleState {
  phase: BattlePhase;
  stage: string;
  /** How many ideas are still standing. */
  left: number;
  /** The round in play, or undefined outside one. */
  round?: Round;
}

/** What's happening at a tick, in the run's terms. */
export function battleState(script: BattleScript, tick: number): BattleState {
  if (tick < script.introEnd) {
    const landed = clamp(Math.floor((tick - 5) / 0.7) + 1, 0, script.ideaCount);
    return { phase: 'intro', stage: script.firstStage, left: landed };
  }
  if (tick >= script.menuStart) {
    return { phase: 'menu', stage: 'The menu', left: script.survivors.length };
  }
  const round = script.rounds.find(({ start, end }) => tick >= start && tick < end);
  if (!round) {
    const stage = script.rounds.at(-1)?.stage ?? script.firstStage;
    return { phase: 'regroup', stage, left: script.survivors.length };
  }
  const out = [...round.knockouts.values()].filter((at) => at <= tick).length;
  const phase =
    tick < round.fightStart ? 'announce' : tick < round.regroupStart ? 'fight' : 'regroup';
  return { phase, stage: round.stage, left: round.alive.length - out, round };
}

interface Place extends Point {
  scale: number;
}

const arena = { left: 3, top: 42, width: 154, height: 84 };

/** Where each of a set of ideas stands. Fewer ideas stand bigger. */
function formation(ids: number[]): Map<number, Place> {
  const columns = ids.length <= 4 ? ids.length : Math.ceil(Math.sqrt(ids.length * 1.5));
  const rows = Math.ceil(ids.length / columns);
  const cellWidth = Math.min(arena.width / columns, 40);
  const cellHeight = Math.min(arena.height / rows, 40);
  const scale = clamp(Math.floor(Math.min(cellWidth, cellHeight - 2) / 8), 1, 4);
  const size = 8 * scale;
  const places = new Map<number, Place>();
  ids.forEach((id, i) => {
    const row = Math.floor(i / columns);
    const inRow = Math.min(columns, ids.length - row * columns);
    const across = arena.left + (arena.width - inRow * cellWidth) / 2;
    const down = arena.top + (arena.height - rows * cellHeight) / 2;
    places.set(id, {
      x: Math.round(across + (i - row * columns) * cellWidth + (cellWidth - size) / 2),
      y: Math.round(down + row * cellHeight + (cellHeight - size) / 2),
      scale,
    });
  });
  return places;
}

/** Where a group's members crowd together to fight: around the spot its survivor will stand on. */
function huddle(group: Group, round: Round): Map<number, Place> {
  const from = formation(round.alive);
  const spot = formation(round.survivors).get(group.survivor);
  const crowded = new Map<number, Place>();
  group.members.forEach((id, i) => {
    const place = from.get(id);
    if (!place || !spot) return;
    const angle = (i / group.members.length) * Math.PI * 2;
    const reach = group.members.length > 1 ? place.scale * 3 : 0;
    const centered = (8 * spot.scale - 8 * place.scale) / 2;
    crowded.set(id, {
      x: Math.round(spot.x + centered + Math.cos(angle) * reach),
      y: Math.round(spot.y + centered + Math.sin(angle) * reach * 0.6),
      scale: place.scale,
    });
  });
  return crowded;
}

const lerp = (from: number, to: number, amount: number) =>
  Math.round(from + (to - from) * clamp(amount, 0, 1));

interface Drawn {
  id: number;
  x: number;
  y: number;
  scale: number;
  flash?: boolean;
}

/** Where every idea on screen is at a tick. */
function drawnIdeas(script: BattleScript, tick: number): Drawn[] {
  const bob = (id: number) => ((tick + id * 3) >> 2) & 1;
  const allPlaces = formation(Array.from({ length: script.ideaCount }, (_, i) => i));
  if (tick < script.introEnd) {
    return [...allPlaces].flatMap(([id, place]) => {
      const at = tick - id * 0.7;
      if (at < 0) return [];
      const falling = clamp(at / 5, 0, 1);
      const landed = at >= 5 && at < 7;
      return [
        {
          id,
          x: place.x,
          y: lerp(-16, place.y, falling * falling) + (landed ? 1 : 0),
          scale: place.scale,
        },
      ];
    });
  }
  const round = script.rounds.find(({ start, end }) => tick >= start && tick < end);
  if (round) {
    const from = formation(round.alive);
    const crowds = new Map<number, Place>();
    for (const group of round.groups) {
      for (const [id, place] of huddle(group, round)) crowds.set(id, place);
    }
    const to = formation(round.survivors);
    return round.alive.flatMap((id): Drawn[] => {
      const start = from.get(id);
      const crowd = crowds.get(id);
      if (!start || !crowd) return [];
      const knockedOut = round.knockouts.get(id);
      if (knockedOut !== undefined && tick >= knockedOut) {
        // Knocked out: a white flash, then it arcs off the screen, flickering, and it's gone.
        const flight = tick - knockedOut;
        if (flight > 11 || (flight > 2 && flight % 2 === 1)) return [];
        const away = crowd.x + 4 * crowd.scale < battleWidth / 2 ? -1 : 1;
        return [
          {
            id,
            x: crowd.x + away * flight * 4,
            y: Math.round(crowd.y - flight * 5 + flight * flight * 0.7),
            scale: crowd.scale,
            flash: flight < 2,
          },
        ];
      }
      if (tick < round.fightStart) return [{ id, ...start, y: start.y - bob(id) }];
      if (tick < round.clashStart) {
        const amount = (tick - round.fightStart + 1) / (round.clashStart - round.fightStart);
        return [
          {
            id,
            x: lerp(start.x, crowd.x, amount),
            y: lerp(start.y, crowd.y, amount) - (tick & 1),
            scale: crowd.scale,
          },
        ];
      }
      if (tick < round.clashEnd) {
        const beat = tick >> 1;
        return [
          {
            id,
            x: crowd.x + Math.round((hash(id, beat) - 0.5) * 6),
            y: crowd.y + Math.round((hash(id + 40, beat) - 0.5) * 4),
            scale: crowd.scale,
          },
        ];
      }
      if (tick < round.regroupStart) {
        // The survivor stands in the stillness, then flashes as it grows.
        return [{ id, ...crowd, flash: tick >= round.regroupStart - 2 }];
      }
      const target = to.get(id);
      if (!target) return [];
      const amount = (tick - round.regroupStart + 1) / (round.end - round.regroupStart);
      return [
        {
          id,
          x: lerp(crowd.x, target.x, amount),
          y: lerp(crowd.y, target.y, amount) - (tick & 1),
          scale: amount >= 0.5 ? target.scale : crowd.scale,
        },
      ];
    });
  }
  const standing = formation(script.survivors);
  const rows = menuRows(script);
  return script.survivors.flatMap((id, i): Drawn[] => {
    const place = standing.get(id);
    const row = rows[i];
    if (!place || !row) return [];
    if (tick < script.menuBoxEnd) return [{ id, ...place, y: place.y - bob(id) }];
    const amount = (tick - script.menuBoxEnd + 1) / (script.menuMarchEnd - script.menuBoxEnd);
    if (amount >= 1) return [{ id, x: row.x, y: row.y, scale: 2 }];
    return [
      {
        id,
        x: lerp(place.x, row.x, amount),
        y: lerp(place.y, row.y, amount) - (tick & 1),
        scale: amount >= 0.5 ? 2 : place.scale,
      },
    ];
  });
}

const menuBox = { left: 8, top: 44, width: 144, height: 80 };

/** Where each card's idea sits in the menu box. */
function menuRows(script: BattleScript): Point[] {
  const rowHeight = Math.min(22, (menuBox.height - 8) / script.cards.length);
  const top = menuBox.top + (menuBox.height - rowHeight * script.cards.length) / 2;
  return script.cards.map((_, i) => ({
    x: menuBox.left + 17,
    y: Math.round(top + rowHeight * i + (rowHeight - 16) / 2),
  }));
}

// Layers draw in this order, and a color within a layer is one path. So a frame is a few paths at most.
type Layer = 'back' | 'box' | 'ideas' | 'marks' | 'words';
const layers: Layer[] = ['back', 'box', 'ideas', 'marks', 'words'];

export interface BattlePath {
  key: string;
  fill: string;
  d: string;
}

class Canvas {
  private readonly paths = new Map<string, BattlePath>();

  rect(layer: Layer, fill: string, x: number, y: number, width: number, height: number) {
    const key = `${layer}-${fill}`;
    const path = this.paths.get(key) ?? { key, fill, d: '' };
    path.d += `M${x} ${y}h${width}v${height}h${-width}z`;
    this.paths.set(key, path);
  }

  sprite(
    layer: Layer,
    art: string[],
    x: number,
    y: number,
    scale: number,
    fills: Record<string, string>,
  ) {
    art.forEach((row, down) => {
      let across = 0;
      while (across < row.length) {
        const key = row.charAt(across);
        let run = 1;
        while (row.charAt(across + run) === key) run += 1;
        const fill = fills[key];
        if (fill) this.rect(layer, fill, x + across * scale, y + down * scale, run * scale, scale);
        across += run;
      }
    });
  }

  text(layer: Layer, fill: string, text: string, x: number, y: number, scale = 1) {
    [...plainText(text)].forEach((letter, i) => {
      const glyph = glyphs[letter] ?? glyphs['?'] ?? '';
      [...glyph].forEach((bit, n) => {
        if (bit !== '1') return;
        const across = x + (i * 4 + (n % 3)) * scale;
        this.rect(layer, fill, across, y + Math.floor(n / 3) * scale, scale, scale);
      });
    });
  }

  all(): BattlePath[] {
    return layers.flatMap((layer) =>
      [...this.paths.values()].filter(({ key }) => key.startsWith(`${layer}-`)),
    );
  }
}

function drawIdea(canvas: Canvas, drawn: Drawn, shakeX: number, shakeY: number) {
  const { id, x, y, scale, flash } = drawn;
  const art = ideaSprites[id % ideaSprites.length] ?? [];
  const tint = color.tints[Math.floor(hash(id, 11) * color.tints.length)] ?? color.white;
  const fills = flash
    ? { '#': color.white, '+': color.white, o: color.white }
    : { '#': tint, '+': color.white, o: color.shadow };
  canvas.sprite('ideas', art, x + shakeX, y + shakeY, scale, fills);
}

function speech(state: BattleState, script: BattleScript, tick: number): string {
  if (state.phase === 'intro') return `${state.left} ideas`;
  if (state.phase === 'menu') return 'The menu';
  if (state.phase === 'announce') return `${state.stage}!`;
  if (state.phase === 'regroup') return `${state.left} left`;
  const round = state.round;
  if (round && tick >= round.clashEnd) return `${state.left} left`;
  return script.rounds.length > 0 && tick >= (round?.clashStart ?? 0) ? 'Fight!' : 'Ready...';
}

/** One frame: the paths to draw at a tick. */
export function battleFrame(script: BattleScript, tick: number): BattlePath[] {
  const at = clamp(tick, 0, script.total);
  const state = battleState(script, at);
  const canvas = new Canvas();
  const { round } = state;

  // A blow shakes the arena for two ticks.
  const recent = round && [...round.knockouts.values()].some((blow) => at >= blow && at < blow + 2);
  const shakeX = recent ? (at & 1 ? 2 : -2) : 0;
  const shakeY = recent ? (at & 1 ? -1 : 1) : 0;

  // The arena.
  canvas.rect('back', color.floor, 0, arena.top - 2, battleWidth, arena.height + 4);
  for (let i = 0; i < 40; i += 1) {
    canvas.rect(
      'back',
      color.floorDot,
      Math.floor(hash(i, 1) * battleWidth),
      arena.top - 2 + Math.floor(hash(i, 2) * (arena.height + 4)),
      2,
      1,
    );
  }

  // The header: who's calling it, and what they say.
  const armUp = state.phase === 'announce' || (state.phase === 'fight' && (at >> 2) & 1);
  const hopping = state.phase === 'menu' ? 0 : state.phase === 'announce' ? (at >> 1) & 1 : 0;
  canvas.sprite('words', orchestratorSprite, 5, 9 - hopping, 2, {
    '#': color.dim,
    '+': color.dim,
    g: color.gold,
    o: color.shadow,
    r: color.red,
  });
  if (armUp) canvas.rect('words', color.dim, 29, 9 - hopping, 3, 12);
  canvas.text('words', color.dim, script.orchestrator, 36, 11);
  const said = speech(state, script, at);
  const big = textWidth(plainText(said), 2) <= battleWidth - 38;
  canvas.text('words', color.white, said, 36, 20, big ? 2 : 1);

  // The menu box, opening from its middle.
  if (at >= script.menuStart) {
    const open = clamp((at - script.menuStart + 1) / (script.menuBoxEnd - script.menuStart), 0, 1);
    const height = Math.max(2, Math.round(menuBox.height * open));
    const top = Math.round(menuBox.top + (menuBox.height - height) / 2);
    canvas.rect('box', color.white, menuBox.left, top, menuBox.width, height);
    canvas.rect(
      'box',
      color.box,
      menuBox.left + 2,
      top + 2,
      menuBox.width - 4,
      Math.max(height - 4, 0),
    );
  }

  for (const drawn of drawnIdeas(script, at)) drawIdea(canvas, drawn, shakeX, shakeY);

  // Dust and sparks while they fight, and a star on each blow.
  if (round && at >= round.clashStart && at < round.clashEnd) {
    round.groups.forEach((group, g) => {
      const crowd = huddle(group, round).get(group.survivor);
      if (!crowd || group.members.length < 2) return;
      const size = 8 * crowd.scale;
      for (let p = 0; p < 5; p += 1) {
        canvas.rect(
          'marks',
          p % 2 ? color.white : color.gold,
          Math.round(crowd.x + hash(g + p, at) * size * 1.4 - size * 0.2 + shakeX),
          Math.round(crowd.y + hash(g + p + 9, at) * size * 1.4 - size * 0.2 + shakeY),
          1 + (p % 2),
          1 + (p % 2),
        );
      }
    });
  }
  if (round) {
    for (const group of round.groups) {
      for (const [id, place] of huddle(group, round)) {
        const blow = round.knockouts.get(id);
        if (blow === undefined || at < blow || at > blow + 2) continue;
        const middleX = place.x + 4 * place.scale;
        const middleY = place.y + 4 * place.scale;
        const reach = 3 + (at - blow) * 2;
        canvas.rect('marks', color.gold, middleX - reach, middleY - 1, reach * 2, 2);
        canvas.rect('marks', color.gold, middleX - 1, middleY - reach, 2, reach * 2);
      }
    }
  }

  // The menu's words: each line types itself out, then a cursor picks the top card.
  if (at >= script.menuMarchEnd) {
    const rows = menuRows(script);
    script.cards.forEach((name, i) => {
      const row = rows[i];
      if (!row) return;
      const shown = Math.max(0, (at - script.menuMarchEnd - i * 4) * 2);
      const text = plainText(name);
      const room = menuBox.left + menuBox.width - (row.x + 21) - 4;
      const scale = textWidth(text, 2) <= room ? 2 : 1;
      canvas.text('words', color.white, text.slice(0, shown), row.x + 21, row.y + 3, scale);
    });
    const first = rows[0];
    if (first && at >= script.menuTextEnd && (at >= script.total || (at >> 1) & 1)) {
      canvas.sprite(
        'words',
        ['#..', '##.', '###', '##.', '#..'],
        menuBox.left + 7,
        first.y + 3,
        2,
        { '#': color.gold },
      );
    }
  }

  // The ladder along the bottom never changes shape, so the point is there at first glance, moving or not.
  const steps = [...script.counts.map(({ cards }) => String(cards)), 'MENU'];
  const reached =
    state.phase === 'menu'
      ? steps.length - 1
      : round && at >= round.clashEnd
        ? script.rounds.indexOf(round) + 1
        : round
          ? script.rounds.indexOf(round)
          : script.rounds.length && at >= script.introEnd
            ? script.rounds.length
            : 0;
  const ladderWidth =
    steps.reduce((sum, step) => sum + textWidth(step, 2), 0) + (steps.length - 1) * 14;
  let across = Math.round((battleWidth - ladderWidth) / 2);
  steps.forEach((step, i) => {
    const fill = i === reached ? color.gold : i < reached ? color.dim : color.white;
    canvas.text('words', fill, step, across, 135, 2);
    across += textWidth(step, 2);
    if (i < steps.length - 1) canvas.text('words', color.dim, '>', across + 4, 135, 2);
    across += 14;
  });

  return canvas.all();
}
