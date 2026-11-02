import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseRun } from './run';
import { runCharts } from './run-mermaid';
import { cleanRenderedSvg, svgIsCurrent, svgText } from './run-svg';

describe('cleaning a rendered SVG', () => {
  const rendered =
    '<svg id="a" width="100%" class="flowchart" role="graphics-document document" aria-roledescription="flowchart-v2">' +
    '<style>#a{fill:#28253D;}</style>' +
    '<g><marker id="a_used"><path class="arrowMarkerPath"></path></marker>' +
    '<marker id="a_unused"><path></path></marker></g>' +
    '<defs><filter id="a_shadow"><feDropShadow flood-color="#000000"></feDropShadow></filter></defs>' +
    '<path marker-end="url(#a_used)" color="#000000" data-points="abc"></path><text fill="#123456">Label</text></svg>';
  const clean = cleanRenderedSvg(rendered, 'flowchart LR');

  it('drops every color, so the page’s CSS variables decide them in both themes', () => {
    expect(clean).not.toMatch(/<style|#[0-9a-f]{3,8}\b|rgb\(/i);
    expect(clean).not.toMatch(/\s(fill|color)=/);
  });

  it('drops the roles, since the visual is hidden with a list beside it (S16)', () => {
    expect(clean).not.toMatch(/\srole=|aria-roledescription/);
  });

  it('drops Mermaid’s bookkeeping', () => {
    expect(clean).not.toContain('data-points');
  });

  it('drops markers nothing uses, and keeps the one in use', () => {
    expect(clean).toContain('id="a_used"');
    expect(clean).not.toContain('a_unused');
  });

  it('records which source it came from', () => {
    expect(svgIsCurrent(clean, 'flowchart LR')).toBe(true);
    expect(svgIsCurrent(clean, 'flowchart TD')).toBe(false);
  });
});

it('reads an SVG’s text, joining a label’s lines and decoding entities', () => {
  expect(
    svgText(
      '<svg><text><tspan>A &amp; B</tspan> <tspan>×3</tspan></text><text>C</text><g><text>Q&#39;s</text></g></svg>',
    ),
  ).toEqual(['A & B ×3', 'C', "Q's"]);
});

// What makes the committed floor safe: CI has no browser to render it, so this is what catches a run file
// that changed without `pnpm charts` being run (G40).
describe('the committed SVGs', () => {
  const dir = 'src/components/charts/mermaid';
  const run = parseRun(JSON.parse(readFileSync('src/content/run.json', 'utf8')));
  const charts = runCharts(run);

  it('are exactly one per chart', () => {
    expect(readdirSync(dir).sort()).toEqual(charts.map(({ id }) => `${id}.svg`).sort());
  });

  for (const chart of charts) {
    describe(chart.id, () => {
      const svg = readFileSync(`${dir}/${chart.id}.svg`, 'utf8');

      it('was rendered from the run file as it is now (if not, run `pnpm charts`)', () => {
        expect(svgIsCurrent(svg, chart.text)).toBe(true);
      });

      it('shows every label', () => {
        const text = svgText(svg);
        for (const label of chart.labels) expect(text).toContain(label);
      });

      it('carries no colors of its own, so it works in both themes', () => {
        expect(svg).not.toMatch(/<style|#[0-9a-f]{3,8}\b|rgb\(/i);
      });
    });
  }
});
