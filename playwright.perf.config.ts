import { defineConfig, devices } from '@playwright/test';

// Throttled checks of scrolling, interaction and transitions (#33), which Lighthouse can't see. They run
// against the built site through the Worker, or a deployed one with PERF_BASE_URL set (ending in
// /skill/). One worker, so tests don't slow each other down. Checked against Playwright 1.64.1 on 2026-10-31.
const port = 8790;
const deployed = process.env.PERF_BASE_URL;

export default defineConfig({
  testDir: './tests/perf',
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: deployed ?? `http://127.0.0.1:${port}/skill/`,
    trace: 'retain-on-failure',
    launchOptions: { args: ['--host-resolver-rules=MAP static.cloudflareinsights.com ~NOTFOUND'] },
  },
  projects: [{ name: 'throttled-phone', use: { ...devices['Pixel 7'] } }],
  ...(deployed
    ? {}
    : {
        webServer: {
          command: `pnpm exec wrangler dev --port ${port} --ip 127.0.0.1`,
          url: `http://127.0.0.1:${port}/skill/`,
          env: { WRANGLER_SEND_METRICS: 'false' },
          reuseExistingServer: false,
          timeout: 60_000,
        },
      }),
});
