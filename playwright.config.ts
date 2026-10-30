import { randomBytes } from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

// Integration tests run against the built site (dist/) served by the real Worker in local workerd,
// so headers, redirects and (from #4) the invite gate are tested as they run in production.
// Run `pnpm build` first. Checked against Playwright 1.64.1 on 2026-10-29.
// Not Wrangler's default 8787, so tests can run beside a `wrangler dev` you've left running.
const port = 8788;
const origin = `http://127.0.0.1:${port}`;

// A throwaway invite secret, new on every run, so tests never touch the production one and failure
// traces uploaded from CI only ever hold a dead value. `??=` because Playwright reloads this file in
// each worker, and workers inherit the first value through the environment.
process.env.TEST_INVITE_SECRET ??= randomBytes(32).toString('hex');

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    // Ends in /skill/, so tests navigate with relative paths ('./', 'essays/'): a leading `/` drops the base.
    baseURL: `${origin}/skill/`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // --var wins over a local .dev.vars; the env var alone wouldn't, but it satisfies `secrets.required`.
    command: `pnpm exec wrangler dev --port ${port} --ip 127.0.0.1 --var INVITE_SECRET:${process.env.TEST_INVITE_SECRET}`,
    url: `${origin}/skill/`,
    env: { WRANGLER_SEND_METRICS: 'false', INVITE_SECRET: process.env.TEST_INVITE_SECRET },
    // Always a fresh server, so a stale `wrangler dev` on the port is never tested by mistake.
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
