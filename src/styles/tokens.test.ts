import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The hard-coded values check (S22, #81): no raw color and no @media width outside tokens.css. Exempt, as the
// spec lists them:
// - The cast's art: its fills are a drawing, not theme chrome. They live in .tsx, which this doesn't scan.
// - A chart's or drawing's own geometry and keyframe percentages: neither is a color or an @media width.
// - A chart's or drawing's own colors, used by nothing else: DRAWING_COLORS, below, by file and value.
// - A treatment's overrides, which S6 scopes to its article root. Piece 3's has no raw values, so it's scanned.
const TOKENS = 'src/styles/tokens.css';
const EXEMPT_FILES = new Map([
  [
    'src/dev/template-sheet.astro',
    'A print tool that exists only under astro dev, never on a page.',
  ],
  [
    'src/dev/themes/themes.css',
    'The contending themes (#85), only in a build with THEMES=yes. Each is a set of token values, which #86 moves into tokens.css.',
  ],
]);
const DRAWING_COLORS = [
  { path: 'src/styles/robot.css', value: '#ec9aa8', reason: "The robot's brain." },
  { path: 'src/styles/robot.css', value: '#8a3b4c', reason: "The folds in the robot's brain." },
  {
    path: 'src/styles/battle.css',
    value: '#181425',
    reason: "The battle's own dark screen, which matches the box in battle.ts.",
  },
];

// Every CSS named color (CSS Color 4), so a theme can't be bypassed by a name.
const NAMED_COLORS = [
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown',
  'burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan',
  'darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid',
  'darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet',
  'deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro',
  'ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki',
  'lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow',
  'lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray',
  'lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine',
  'mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise',
  'mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab',
  'orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru',
  'pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown',
  'seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan',
  'teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen',
]
  .join(' ')
  .split(' ');
// A name followed by `(` is a function, such as tan().
const RAW_COLOR = new RegExp(
  `#[0-9a-f]{3,8}\\b|\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(|(?<![\\w-])(?:${NAMED_COLORS.join('|')})(?![\\w(-])`,
  'gi',
);

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** The raw colors in a stylesheet's declarations, so not in its selectors, names, strings or comments. */
function rawColors(css: string): string[] {
  const values = withoutComments(css).matchAll(/[\w-]+\s*:\s*([^;{}]+)(?=[;}])/g);
  return [...values].flatMap(([, value = '']) => {
    const bare = value
      .replace(/var\(--[\w-]+/g, 'var(')
      .replace(/url\([^)]*\)/g, '')
      .replace(/'[^']*'|"[^"]*"/g, '');
    return bare.match(RAW_COLOR) ?? [];
  });
}

/** The lengths in an @media query's width features: min-width, max-width, width, and range syntax. */
function mediaWidths(css: string): string[] {
  const queries = withoutComments(css).matchAll(/@media[^{]+/g);
  return [...queries].flatMap(([query]) =>
    [...query.matchAll(/\(([^()]+)\)/g)].flatMap(([, feature = '']) => {
      const plain = /^\s*(?:min-|max-)?width\s*:\s*([^\s]+)\s*$/.exec(feature);
      if (plain?.[1]) return [plain[1]];
      const range = /(?<![\w-])width(?![\w-])/.test(feature) && /[<>=]/.test(feature);
      return range ? (feature.match(/[\d.]+[a-z]+/gi) ?? []) : [];
    }),
  );
}

/** What an .astro file has in its style tags, or the whole of a stylesheet. */
function cssOf(path: string): string {
  const source = readFileSync(path, 'utf8');
  if (!path.endsWith('.astro')) return source;
  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(([, css]) => css).join('\n');
}

const sheets = globSync('{src,content}/**/*.{css,astro}').filter((path) => !EXEMPT_FILES.has(path));

describe('the scan', () => {
  it.each([
    ['a hex color', 'a { color: #8a3b4c; }'],
    ['a short hex color', 'a { color: #000 }'],
    ['rgb()', 'a { box-shadow: 0 0 1px rgb(0 0 0 / 12%); }'],
    ['hsl()', 'a { --x: hsl(10 20% 30%); }'],
    ['oklch()', 'a { fill: oklch(50% 0.1 20); }'],
    ['a named color', 'a { border: 1px solid white; }'],
    ['a rarer named color', 'a { color: papayawhip; }'],
  ])('catches %s', (_name, css) => {
    expect(rawColors(css)).toHaveLength(1);
  });

  it.each([
    ['a token', 'a { color: var(--white); }'],
    ['a mix of tokens', 'a { fill: color-mix(in oklch, var(--accent) 60%, var(--ink)); }'],
    ['transparent', 'a { background: transparent; }'],
    ['a comment', '/* white on #000 */ a { top: 0; }'],
    ['a selector', '.white:hover, #abc { top: 0; }'],
    ['a name', 'a { animation: red-flash 1s; }'],
    ['a string', "a { font-family: 'Red Hat Text'; }"],
    ['a link to an id', 'a { fill: url(#abc); }'],
    ['a function with a color name', 'a { rotate: calc(tan(30deg) * 1rad); }'],
  ])('leaves %s alone', (_name, css) => {
    expect(rawColors(css)).toEqual([]);
  });

  it.each([
    ['max-width', '@media (max-width: 700px)', ['700px']],
    ['range syntax', '@media (40em <= width)', ['40em']],
    ['a range on both sides', '@media (400px < width <= 700px)', ['400px', '700px']],
    ['width among other features', '@media (min-width: 30rem) and (max-height: 500px)', ['30rem']],
    ['a height', '@media (max-height: 600px)', []],
    ['a resolution', '@media (min-resolution: 2dppx)', []],
    ['a color scheme', '@media (prefers-color-scheme: dark)', []],
  ])('reads the widths in %s', (_name, query, widths) => {
    expect(mediaWidths(`${query} { a { width: 3px; } }`)).toEqual(widths);
  });

  it('reaches every stylesheet, a piece’s included', () => {
    for (const name of ['site', 'parade', 'figures', 'robot', 'umbrella', 'battle', 'run-charts']) {
      expect(sheets).toContain(`src/styles/${name}.css`);
    }
    expect(sheets).toContain(TOKENS);
    expect(sheets.filter((path) => path.startsWith('content/')).length).toBeGreaterThan(0);
  });
});

describe('the stylesheets', () => {
  it.each(sheets.filter((path) => path !== TOKENS))('%s has no raw colors', (path) => {
    const allowed = DRAWING_COLORS.filter((color) => color.path === path).map(({ value }) => value);
    const colors = rawColors(cssOf(path)).filter((color) => !allowed.includes(color.toLowerCase()));
    expect(colors).toEqual([]);
  });

  it.each(DRAWING_COLORS)('$path still uses its exempt $value', ({ path, value }) => {
    expect(rawColors(cssOf(path)).map((color) => color.toLowerCase())).toContain(value);
  });

  it('hold every @media width to the breakpoint token', () => {
    const breakpoint = /--breakpoint-phone:\s*([^;]+);/.exec(cssOf(TOKENS))?.[1];
    expect(breakpoint).toBe('560px');

    const widths = sheets.flatMap((path) =>
      mediaWidths(cssOf(path)).map((width) => ({ path, width })),
    );
    expect(widths.length).toBeGreaterThan(0);
    expect(widths.filter(({ width }) => width !== breakpoint)).toEqual([]);
  });
});
