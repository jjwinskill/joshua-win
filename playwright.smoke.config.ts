import { defineConfig } from '@playwright/test';

// Smoke tests against a deployed site, run by CI after a deploy. They need no browser and no secret:
// everything here is what the public gets. Checked against Playwright 1.64.1 on 2026-10-30.
export default defineConfig({
  testDir: './tests/smoke',
  // For a blip. Retries are immediate, so they give DNS or a new certificate no grace; the first
  // deploy happens by hand, well before CI ever runs this.
  retries: 2,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: 'https://joshua.win/skill/' },
});
