import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The hard-coded values check (S22, #81). Exempt from it, as the spec lists them:
// - The cast's art: its fills are a drawing, not theme chrome. They live in .tsx, which this doesn't scan.
// - A chart's or drawing's own geometry and keyframe percentages: neither is a color or an @media width.
// - A treatment's overrides, which S6 scopes to its article root with a reason: EXEMPT, below.
const TOKENS = 'src/styles/tokens.css';
const EXEMPT = new Map([
  [
    'content/lorem/one-offs/ut-labore.css',
    "Piece 3's treatment, and the Swirl stays as it is (G35, G44).",
  ],
  [
    'src/dev/template-sheet.astro',
    'A print tool that exists only under astro dev, and no page uses.',
  ],
]);

const NAMED_COLORS =
  'black|white|gray|grey|silver|red|maroon|orange|gold|yellow|olive|lime|green|teal|cyan|aqua|blue|navy|indigo|purple|violet|magenta|fuchsia|pink|brown|tan|beige';
const RAW_COLOR = new RegExp(
  `#[0-9a-f]{3,8}\\b|\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(|(?<![\\w-])(?:${NAMED_COLORS})(?![\\w-])`,
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

/** Every length in an @media query about width. */
function mediaWidths(css: string): string[] {
  const queries = withoutComments(css).matchAll(/@media[^{]+/g);
  return [...queries]
    .filter(([query]) => query.includes('width'))
    .flatMap(([query]) => query.match(/[\d.]+[a-z]+/g) ?? []);
}

/** What an .astro file has in its style tags, or the whole of a stylesheet. */
function cssOf(path: string): string {
  const source = readFileSync(path, 'utf8');
  if (!path.endsWith('.astro')) return source;
  return [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(([, css]) => css).join('\n');
}

const sheets = globSync('{src,content}/**/*.{css,astro}').filter((path) => !EXEMPT.has(path));

describe('the scan', () => {
  it.each([
    ['a hex color', 'a { color: #8a3b4c; }'],
    ['a short hex color', 'a { color: #000 }'],
    ['rgb()', 'a { box-shadow: 0 0 1px rgb(0 0 0 / 12%); }'],
    ['hsl()', 'a { --x: hsl(10 20% 30%); }'],
    ['oklch()', 'a { fill: oklch(50% 0.1 20); }'],
    ['a named color', 'a { border: 1px solid white; }'],
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
  ])('leaves %s alone', (_name, css) => {
    expect(rawColors(css)).toEqual([]);
  });

  it('finds a width in an @media query, and nothing in another kind', () => {
    expect(mediaWidths('@media (max-width: 700px) { a { top: 0; } }')).toEqual(['700px']);
    expect(mediaWidths('@media (40em <= width) { a { top: 0; } }')).toEqual(['40em']);
    expect(mediaWidths('@media (prefers-color-scheme: dark) { a { width: 3px; } }')).toEqual([]);
  });

  it('reaches every stylesheet', () => {
    for (const name of ['site', 'parade', 'figures', 'robot', 'umbrella', 'battle', 'run-charts']) {
      expect(sheets).toContain(`src/styles/${name}.css`);
    }
    expect(sheets).toContain(TOKENS);
  });
});

describe('the stylesheets', () => {
  it.each(sheets.filter((path) => path !== TOKENS))('%s has no raw colors', (path) => {
    expect(rawColors(cssOf(path))).toEqual([]);
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
