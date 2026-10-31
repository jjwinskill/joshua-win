// The site's pieces, newest first (S9), wherever they're listed.
export function newestFirst<T extends { data: { date: Date } }>(pieces: readonly T[]): T[] {
  return [...pieces].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
