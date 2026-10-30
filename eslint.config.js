import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default defineConfig(
  // .claude/skills is vendored (skills-lock.json), so it's not ours to lint.
  { ignores: ['dist/', '.astro/', 'drafts/', 'node_modules/', '.claude/'] },
  js.configs.recommended,
  tseslint.configs.strict,
  astro.configs.recommended,
  astro.configs['jsx-a11y-recommended'],
  {
    files: ['**/*.{jsx,tsx}'],
    extends: [jsxA11y.flatConfigs.recommended],
  },
  {
    languageOptions: { globals: globals.browser },
  },
  {
    // Only config and test-setup files run in Node; site code runs in the browser.
    files: ['*.config.{js,mjs,ts}', 'vitest.setup.ts'],
    languageOptions: { globals: globals.node },
  },
);
