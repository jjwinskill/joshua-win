import { expect, it } from 'vitest';
import { newestFirst, pieceKicker, piecePath } from './pieces';

it('sorts pieces newest first, without changing the original list', () => {
  const older = { data: { date: new Date('2026-01-01') } };
  const newer = { data: { date: new Date('2026-06-01') } };
  const pieces = [older, newer];
  expect(newestFirst(pieces)).toEqual([newer, older]);
  expect(pieces).toEqual([older, newer]);
});

it('gives each kind of piece its own route', () => {
  expect(piecePath('essay', 'a')).toBe('essays/a/');
  expect(piecePath('write-up', 'b')).toBe('write-ups/b/');
});

it('says what kind of piece it is on the card and the page', () => {
  expect(pieceKicker('essay')).toMatch(/^Essay/);
  expect(pieceKicker('write-up')).toMatch(/^Write-up/);
});
