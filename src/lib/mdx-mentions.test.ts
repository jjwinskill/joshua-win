import { expect, it } from 'vitest';
import { castMentionsPlugin, mentionMarkup } from './mdx-mentions';

const withId = (id: string, name = 'span') => ({ name, attributes: [{ name: 'id', value: id }] });

it('turns a mention into markup the mentions check can read', () => {
  expect(mentionMarkup(withId('cast-milk'))).toBe('<span id="cast-milk"></span>');
});

it('ignores other ids, elements with no id, and an id that’s an expression', () => {
  expect(mentionMarkup(withId('something-else'))).toBe('');
  expect(mentionMarkup({ attributes: [] })).toBe('');
  expect(mentionMarkup({ attributes: [{ name: 'id', value: { type: 'expression' } }] })).toBe('');
});

it('ignores a component given a cast id, which might not render it', () => {
  expect(mentionMarkup(withId('cast-milk', 'ScrollTally'))).toBe('');
});

it('collects mentions in the order it visits them, and keeps a repeat so the check can fail it', () => {
  const frontmatter: { castMentions?: string } = {};
  const ctx = { data: { astro: { frontmatter } } };
  castMentionsPlugin.mdxJsxFlowElement(withId('cast-press'), ctx);
  castMentionsPlugin.mdxJsxTextElement({ attributes: [] }, ctx);
  castMentionsPlugin.mdxJsxTextElement(withId('cast-milk'), ctx);
  castMentionsPlugin.mdxJsxTextElement(withId('cast-press'), ctx);
  expect(frontmatter.castMentions).toBe(
    '<span id="cast-press"></span><span id="cast-milk"></span><span id="cast-press"></span>',
  );
});
