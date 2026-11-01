/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Unit tests run in Node; component tests (React, *.test.tsx) run in jsdom with Testing Library.
// Playwright covers the built site through the Worker, so it lives outside Vitest.
export default getViteConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'worker/**/*.test.ts', 'tests/build/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          include: ['src/**/*.test.tsx', 'content/**/*.test.tsx'],
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
