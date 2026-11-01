// An MDX entry has no rendered HTML at build time, because it compiles to a component. So the mentions
// check can't read one, and it reads this instead: every <span id="cast-…"> in the MDX, as markup, in
// document order. Visiting only JSX means a marker quoted in code or a comment doesn't count, as with
// rendered Markdown. A mention must be in the piece's own MDX, because this can't see what a component renders.
interface JsxNode {
  attributes?: readonly { name?: string; value?: unknown }[];
}

export function mentionMarkup(node: JsxNode): string {
  const id = node.attributes?.find(({ name }) => name === 'id')?.value;
  return typeof id === 'string' && id.startsWith('cast-') ? `<span id="${id}"></span>` : '';
}

interface PluginContext {
  data: Record<string, unknown>;
}

function collect(node: JsxNode, ctx: PluginContext) {
  const { frontmatter } = ctx.data.astro as { frontmatter: { castMentions?: string } };
  frontmatter.castMentions = (frontmatter.castMentions ?? '') + mentionMarkup(node);
}

// A Sätteri plugin, which visits these in document order (checked against @astrojs/markdown-satteri 0.4.6
// and satteri 0.10.5). `render()` hands this frontmatter back as `remarkPluginFrontmatter`.
export const castMentionsPlugin = {
  name: 'cast-mentions',
  mdxJsxTextElement: collect,
  mdxJsxFlowElement: collect,
};
