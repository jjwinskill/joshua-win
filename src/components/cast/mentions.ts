// A first mention is an inline span in a piece's Markdown: <span id="cast-rabbit">The White Rabbit</span>.
import type { CastKey } from './registry';

export function mentionId(key: CastKey): string {
  return `cast-${key}`;
}

// Puts a piece's cast in order of appearance, and fails the build if any listed member doesn't have
// exactly one mention, so the cast list can never link to nothing.
export function castInOrderOfAppearance(body: string, cast: readonly CastKey[]): CastKey[] {
  const positions = cast.map((key) => {
    const marker = `id="${mentionId(key)}"`;
    const first = body.indexOf(marker);
    if (first === -1) throw new Error(`Cast member "${key}" has no mention: add <span ${marker}>.`);
    if (body.indexOf(marker, first + 1) !== -1) {
      throw new Error(`Cast member "${key}" has more than one mention: ids must be unique.`);
    }
    return { key, first };
  });
  return positions.sort((a, b) => a.first - b.first).map(({ key }) => key);
}
