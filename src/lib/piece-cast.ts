import { render, type CollectionEntry } from 'astro:content';
import { castInOrderOfAppearance } from '../components/cast/mentions';

// A piece's cast in order of appearance, for Markdown and MDX alike. It fails the build on a bad mention.
export async function pieceCast(piece: CollectionEntry<'lorem'>) {
  const html: string =
    piece.rendered?.html ?? (await render(piece)).remarkPluginFrontmatter.castMentions ?? '';
  return castInOrderOfAppearance(html, piece.data.cast);
}
