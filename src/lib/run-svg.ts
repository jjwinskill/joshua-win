// Turns Mermaid's output into the SVG we commit (G40). Mermaid's own colors can't be CSS variables, so its
// stylesheet and colors go, and src/styles/run-charts.css colors the chart with the page's variables,
// which is what makes one file work in both themes. It also records a hash of the source, so a test with
// no browser can tell a stale file from a current one. Only the render script and tests use this.
import { createHash } from 'node:crypto';

const hash = (source: string) => createHash('sha256').update(source).digest('hex');
const sourceAttribute = (source: string) => `data-source-sha256="${hash(source)}"`;

function dropUnusedMarkers(svg: string): string {
  return svg.replace(/<marker id="([^"]+)"[\s\S]*?<\/marker>/g, (marker, id: string) =>
    svg.includes(`url(#${id})`) ? marker : '',
  );
}

export function cleanRenderedSvg(svg: string, source: string): string {
  const clean = svg
    .replace(/<style>[\s\S]*?<\/style>/g, '')
    // Its drop shadows, which nothing here uses and which bring a color of their own.
    .replace(/<defs>\s*<filter[\s\S]*?<\/defs>/g, '')
    .replace(/\s(?:role|aria-roledescription|fill|color|data-[a-z-]+)="[^"]*"/g, '')
    .replace(/<svg /, `<svg ${sourceAttribute(source)} `);
  return dropUnusedMarkers(clean);
}

export function svgIsCurrent(svg: string, source: string): boolean {
  return svg.includes(sourceAttribute(source));
}

const decode = (text: string) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&');

/** Each <text> element's words, for checking what a chart shows. */
export function svgText(svg: string): string[] {
  return [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(([, inner]) =>
    decode(
      (inner ?? '').replace(/(?=<tspan class="text-outer-tspan)/g, ' ').replace(/<[^>]+>/g, ''),
    )
      .replace(/\s+/g, ' ')
      .trim(),
  );
}
