// The floor that can ship (S16): a chart as a committed SVG rendered from the run file (G40), with no
// JavaScript. The visual is hidden from screen readers, with a list of the same content beside it. The SVG
// is our own committed file, so setting it as HTML is safe.
import '../../styles/run-charts.css';
import { run } from '../../lib/run-file';
import { runCharts, type RunChartId } from '../../lib/run-mermaid';

const svgs = import.meta.glob<string>('./mermaid/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export function MermaidFloor({ chart: id }: { chart: RunChartId }) {
  const chart = runCharts(run).find((candidate) => candidate.id === id);
  const svg = svgs[`./mermaid/${id}.svg`];
  if (!chart || !svg) throw new Error(`No rendered chart "${id}": run \`pnpm charts\`.`);
  return (
    <figure className="run-chart">
      <div
        className="run-chart-visual"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <ol className="visually-hidden">
        {chart.list.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <figcaption>{chart.title}</figcaption>
    </figure>
  );
}
