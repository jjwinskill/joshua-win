// Renders the Mermaid floor to the SVGs committed in src/components/charts/mermaid/ (G40). Run it with
// `pnpm charts` after changing the run file or how charts are generated, then commit the result. Mermaid
// needs a browser to render, which CI doesn't need to have: a test checks the committed SVGs match the run
// file instead. Checked against Mermaid 12.2.0 and Playwright 1.64.1 on 2026-11-01.
import { readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { parseRun } from '../src/lib/run.ts';
import { runCharts } from '../src/lib/run-mermaid.ts';
import { cleanRenderedSvg } from '../src/lib/run-svg.ts';

const outDir = 'src/components/charts/mermaid';
const run = parseRun(JSON.parse(await readFile('src/content/run.json', 'utf8')));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><html><body></body></html>');
await page.addScriptTag({ path: 'node_modules/mermaid/dist/mermaid.min.js' });

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
for (const chart of runCharts(run)) {
  const svg = await page.evaluate(
    async ({ id, text }) => {
      const { mermaid } = window as unknown as {
        mermaid: {
          initialize: (config: object) => void;
          render: (id: string, text: string) => Promise<{ svg: string }>;
        };
      };
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        look: 'classic',
        htmlLabels: false,
        // Labels are measured in this wide font, and readers see a narrower one, so they always fit a box.
        fontFamily: 'Verdana, sans-serif',
        fontSize: 14,
        // Tight, so a chart scaled down to a phone's width keeps its labels readable.
        flowchart: {
          useMaxWidth: true,
          htmlLabels: false,
          wrappingWidth: 240,
          minNodeWidth: 40,
          nodeSpacing: 20,
          rankSpacing: 28,
          padding: 10,
        },
      });
      return (await mermaid.render(`run-chart-${id}`, text)).svg;
    },
    { id: chart.id, text: chart.text },
  );
  await writeFile(`${outDir}/${chart.id}.svg`, `${cleanRenderedSvg(svg, chart.text)}\n`);
  console.log(`Rendered ${chart.id}`);
}
await browser.close();
