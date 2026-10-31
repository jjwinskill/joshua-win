// Until MDX is decided in phase 3 (S15), a lorem piece marks where a figure goes with an empty element in
// its Markdown: <div data-figure="scene"></div>. This splits the rendered HTML around those markers.
export type FigureName = 'scene' | 'chart';

export type PiecePart = { html: string } | { figure: FigureName };

export function splitAtFigures(html: string): PiecePart[] {
  return html.split(/<div data-figure="(scene|chart)"><\/div>/).flatMap((part, i): PiecePart[] => {
    if (i % 2) return [{ figure: part as FigureName }];
    return part.trim() ? [{ html: part }] : [];
  });
}
