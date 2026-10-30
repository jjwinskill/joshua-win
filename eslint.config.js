import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default defineConfig(
  // .claude/skills is vendored (skills-lock.json), so it's not ours to lint.
  {
    ignores: [
      'dist/',
      '.astro/',
      '.wrangler/',
      'drafts/',
      'node_modules/',
      '.claude/skills/',
      'worker-configuration.d.ts',
      'test-results/',
      'playwright-report/',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strict,
  astro.configs.recommended,
  astro.configs['jsx-a11y-recommended'],
  {
    files: ['**/*.{jsx,tsx}'],
    extends: [jsxA11y.flatConfigs.recommended],
  },
  // Globals only matter to `no-undef` in JavaScript files: typescript-eslint turns that rule off
  // for TypeScript, where tsc does the checking, and eslint-plugin-astro sets .astro globals itself.
  // So: JavaScript in src/ is site code and gets browser globals; JavaScript anywhere else is
  // tooling (configs, lighthouserc, scripts) and runs in Node.
  {
    files: ['src/**/*.{js,mjs,cjs,jsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ignores: ['src/**'],
    languageOptions: { globals: globals.node },
  },
);
