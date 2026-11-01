import { expect, it } from 'vitest';
import { castMentionsPlugin, mentionMarkup } from './mdx-mentions';

const withId = (id: string) => ({ attributes: [{ name: 'id', value: id }] });

it('turns a mention into markup the mentions check can read', () => {
  expect(mentionMarkup(withId('cast-queen'))).toBe('<span id="cast-queen"></span>');
});

it('ignores other ids, elements with no id, and an id that’s an expression', () => {
  expect(mentionMarkup(withId('something-else'))).toBe('');
  expect(mentionMarkup({ attributes: [] })).toBe('');
  expect(mentionMarkup({ attributes: [{ name: 'id', value: { type: 'expression' } }] })).toBe('');
});

it('collects mentions in the order it visits them, and keeps a repeat so the check can fail it', () => {
  const frontmatter: { castMentions?: string } = {};
  const ctx = { data: { astro: { frontmatter } } };
  castMentionsPlugin.mdxJsxFlowElement(withId('cast-cat'), ctx);
  castMentionsPlugin.mdxJsxTextElement({ attributes: [] }, ctx);
  castMentionsPlugin.mdxJsxTextElement(withId('cast-queen'), ctx);
  castMentionsPlugin.mdxJsxTextElement(withId('cast-cat'), ctx);
  expect(frontmatter.castMentions).toBe(
    '<span id="cast-cat"></span><span id="cast-queen"></span><span id="cast-cat"></span>',
  );
});
