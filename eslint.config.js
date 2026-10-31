import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import eslintReact from '@eslint-react/eslint-plugin';
import globals from 'globals';

// Hook mistakes and leaked timers, listeners and observers (G32). All are errors: lint exists to keep
// agents honest, so nothing here is advice to skip. Checked against eslint-plugin-react-hooks 7.1.1 and
// @eslint-react/eslint-plugin 5.28.8 on 2026-10-31.
const hookRules = Object.fromEntries(
  Object.keys(reactHooks.configs.flat.recommended.rules).map((rule) => [rule, 'error']),
);
const leakRules = Object.fromEntries(
  [
    'event-listener',
    'fetch',
    'intersection-observer',
    'interval',
    'resize-observer',
    'timeout',
  ].map((leak) => [`@eslint-react/web-api-no-leaked-${leak}`, 'error']),
);

export default defineConfig(
  // .claude/skills is vendored (skills-lock.json), so it's not ours to lint.
  {
    ignores: [
      'dist/',
      '.lighthouseci/',
      'lighthouse-reports/',
      'perf-results/',
      '.astro/',
      '.wrangler/',
      'drafts/',
      '.drafts-test/',
      '.cast-test/',
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
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, '@eslint-react': eslintReact },
    rules: { ...hookRules, ...leakRules },
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
