export const pieceKinds = ['essay', 'write-up'] as const;
export type PieceKind = (typeof pieceKinds)[number];

// The site's pieces, newest first (S9), wherever they're listed.
export function newestFirst<T extends { data: { date: Date } }>(pieces: readonly T[]): T[] {
  return [...pieces].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function piecePath(kind: PieceKind, slug: string): string {
  return kind === 'essay' ? `essays/${slug}/` : `write-ups/${slug}/`;
}

export function pieceKicker(kind: PieceKind): string {
  return kind === 'essay' ? 'Essay · placeholder text' : 'Write-up · placeholder text';
}
