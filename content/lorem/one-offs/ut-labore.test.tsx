import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';

const here = join(process.cwd(), 'content', 'lorem');
const read = (file: string) => readFileSync(join(here, file), 'utf8');

function inUnicodeRange(css: string) {
  const range = /unicode-range:([^;]+);/.exec(css)?.[1] ?? '';
  const spans = [...range.matchAll(/U\+([0-9A-F]+)(?:-([0-9A-F]+))?/g)].map(([, from, to]) => [
    parseInt(from ?? '', 16),
    parseInt(to ?? from ?? '', 16),
  ]);
  return (char: string) => {
    const code = char.codePointAt(0) ?? 0;
    return spans.some(([from = 0, to = 0]) => code >= from && code <= to);
  };
}

test('the font’s subset covers every character of piece 3, and the letters of Haňťa', () => {
  const covered = inUnicodeRange(read('one-offs/ut-labore.css'));
  const text = read('ut-labore.mdx') + 'Haňťa HAŇŤA';
  const missing = [...new Set(text.replace(/\s/g, ''))].filter((char) => !covered(char));
  expect(missing).toEqual([]);
});
