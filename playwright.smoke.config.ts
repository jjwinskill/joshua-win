import { defineConfig } from '@playwright/test';

// Smoke tests against a deployed site, run by CI after a deploy. They need no browser and no secret:
// everything here is what the public gets. Checked against Playwright 1.64.1 on 2026-10-30.
export default defineConfig({
  testDir: './tests/smoke',
  // A new custom domain's certificate and DNS can take a moment after the first deploy.
  retries: 2,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: process.env.SMOKE_BASE_URL ?? 'https://joshua.win/skill/' },
});
