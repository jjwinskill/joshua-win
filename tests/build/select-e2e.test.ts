import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { selectSpecs } from '../../scripts/select-e2e.ts';

describe('selectSpecs', () => {
  it('always keeps the noindex specs', () => {
    expect(selectSpecs(['docs/plan.md', 'README.md'])).toEqual(['routes', 'worker']);
  });

  it('picks the spec for a chart, and for a spec that changed', () => {
    expect(selectSpecs(['src/styles/robot.css', 'tests/e2e/home.spec.ts'])).toEqual([
      'home',
      'robot',
      'routes',
      'worker',
    ]);
  });

  it('adds no specs for a unit test', () => {
    expect(selectSpecs(['src/components/charts/ScrollRobot.test.tsx'])).toEqual([
      'routes',
      'worker',
    ]);
  });

  it.each([
    'src/layouts/Base.astro',
    'src/styles/site.css',
    'worker/route.ts',
    'astro.config.mjs',
    'pnpm-lock.yaml',
    'tests/e2e/fail-on-errors.ts',
    '.github/workflows/ci.yml',
  ])('runs everything for %s', (path) => {
    expect(selectSpecs([path])).toBe('all');
  });

  it('only names specs that exist', () => {
    const folder = fileURLToPath(new URL('../e2e/', import.meta.url));
    const existing = readdirSync(folder).map((file) => file.replace('.spec.ts', ''));
    const paths = [
      'src/components/charts/x',
      'src/components/parade/x',
      'src/components/figures/x',
      'content/lorem/lorem-ipsum.md',
      'content/lorem/ut-labore.mdx',
    ];
    for (const path of paths) {
      const specs = selectSpecs([path]);
      expect(specs).not.toBe('all');
      for (const spec of specs as string[]) expect(existing).toContain(spec);
    }
  });
});
