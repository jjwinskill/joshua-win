// A first mention is an inline span in a piece's Markdown: <span id="cast-rabbit">The White Rabbit</span>.
import type { CastKey } from './registry';

export function mentionId(key: CastKey): string {
  return `cast-${key}`;
}

// Puts a piece's cast in order of appearance, and fails the build if any listed member doesn't have
// exactly one mention, so the cast list can never link to nothing. It reads the rendered HTML, so a
// marker quoted in a code span doesn't count, and comments are ignored.
export function castInOrderOfAppearance(html: string, cast: readonly CastKey[]): CastKey[] {
  const page = html.replace(/<!--[\s\S]*?-->/g, '');
  const positions = cast.map((key) => {
    const id = mentionId(key);
    const mentions = [...page.matchAll(new RegExp(`<[^>]*\\sid=["']${id}["'][^>]*>`, 'g'))];
    const [mention] = mentions;
    if (!mention) throw new Error(`Cast member "${key}" has no mention: add <span id="${id}">.`);
    if (mentions.length > 1) {
      throw new Error(`Cast member "${key}" has more than one mention: ids must be unique.`);
    }
    return { key, position: mention.index };
  });
  return positions.sort((a, b) => a.position - b.position).map(({ key }) => key);
}
