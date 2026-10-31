import { defineConfig, devices } from '@playwright/test';

// Integration tests run against the built site (dist/) served by the real Worker in local workerd,
// so headers and redirects are tested as they run in production.
// Run `pnpm build` first. Checked against Playwright 1.64.1 on 2026-10-29.
// Not Wrangler's default 8787, so tests can run beside a `wrangler dev` you've left running.
const port = 8788;
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    // Ends in /skill/, so tests navigate with relative paths ('./', 'essays/'): a leading `/` drops the base.
    baseURL: `${origin}/skill/`,
    trace: 'retain-on-failure',
    // main's build carries the analytics beacon, and test runs mustn't count as readers.
    launchOptions: { args: ['--host-resolver-rules=MAP static.cloudflareinsights.com ~NOTFOUND'] },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec wrangler dev --port ${port} --ip 127.0.0.1`,
    url: `${origin}/skill/`,
    env: { WRANGLER_SEND_METRICS: 'false' },
    // Always a fresh server, so a stale `wrangler dev` on the port is never tested by mistake.
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
