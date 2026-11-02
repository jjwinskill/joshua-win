// Which Playwright specs a change needs. Specs test the built site over HTTP and import nothing from
// src/, so Playwright's own --only-changed can't see this: the map is by hand (G48).

const ALWAYS = ['routes', 'worker'];
const PARADE = ['parade', 'essay', 'piece-3'];
const CHARTS = ['battle', 'robot', 'umbrella', 'write-up'];

// The first prefix that matches wins.
const MAP: [string, string[]][] = [
  ['src/components/charts/PixelBattle', ['battle']],
  ['src/components/charts/ScrollRobot', ['robot']],
  ['src/styles/robot.css', ['robot']],
  ['src/components/charts/UmbrellaCarousel', ['umbrella']],
  ['src/components/charts/umbrella-pose', ['umbrella']],
  ['src/styles/umbrella.css', ['umbrella']],
  ['src/components/charts/', CHARTS],
  ['src/content/run.json', CHARTS],
  ['src/components/parade/', PARADE],
  ['src/components/cast/', PARADE],
  ['src/styles/parade.css', PARADE],
  ['src/components/figures/', ['heavy']],
  ['content/lorem/lorem-ipsum', ['essay', 'parade']],
  ['content/lorem/amet-consectetur', ['heavy']],
  ['content/lorem/excepteur-sint', CHARTS],
  ['content/lorem/ut-labore', ['piece-3']],
  ['content/lorem/one-offs/', ['piece-3']],
];

// Paths no built page depends on, so they add no specs.
const NOTHING = [
  /^docs\//,
  /^\.claude\//,
  /^[^/]+\.md$/,
  /^tests\/build\//,
  /^scripts\//,
  /\.test\.tsx?$/,
];

/** The specs for a list of changed paths. A path it doesn't know runs every spec, so a gap is slow, not unsafe. */
export function selectSpecs(paths: string[]): string[] | 'all' {
  const specs = new Set(ALWAYS);
  for (const path of paths) {
    if (NOTHING.some((pattern) => pattern.test(path))) continue;
    const spec = /^tests\/e2e\/(.+)\.spec\.ts$/.exec(path)?.[1];
    if (spec) {
      specs.add(spec);
      continue;
    }
    const entry = MAP.find(([prefix]) => path.startsWith(prefix));
    if (!entry) return 'all';
    for (const name of entry[1]) specs.add(name);
  }
  return [...specs].sort();
}
