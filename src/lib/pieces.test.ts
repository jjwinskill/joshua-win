import { expect, it } from 'vitest';
import { newestFirst } from './pieces';

it('sorts pieces newest first, without changing the original list', () => {
  const older = { data: { date: new Date('2026-01-01') } };
  const newer = { data: { date: new Date('2026-06-01') } };
  const pieces = [older, newer];
  expect(newestFirst(pieces)).toEqual([newer, older]);
  expect(pieces).toEqual([older, newer]);
});
