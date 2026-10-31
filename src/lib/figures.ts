// Until MDX is decided in phase 3 (S15), a lorem piece marks where a figure goes with an empty element in
// its Markdown: <div data-figure="scene"></div>. This splits the rendered HTML around those markers.
export type FigureName = 'scene' | 'chart';

export type PiecePart = { html: string } | { figure: FigureName };

const marker = /<div data-figure="(scene|chart)"><\/div>/;

export function hasFigures(html: string): boolean {
  return html.includes('data-figure=');
}

export function splitAtFigures(html: string): PiecePart[] {
  return html.split(marker).flatMap((part, i): PiecePart[] => {
    if (i % 2) return [{ figure: part as FigureName }];
    // A marker that didn't match is a typo, and it would silently lose its figure.
    if (part.includes('data-figure=')) throw new Error(`Unknown figure marker in: ${part}`);
    return part.trim() ? [{ html: part }] : [];
  });
}
