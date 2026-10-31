// Lighthouse CI on the built site through the real Worker (#5). Checked against @lhci/cli 0.15.1
// (Lighthouse 12.6.1) on 2026-10-30. Run `pnpm build` first. Port 8788 is Playwright's.
const port = 8789;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `pnpm exec wrangler dev --port ${port} --ip 127.0.0.1`,
      startServerReadyPattern: 'Ready on',
      url: [`http://127.0.0.1:${port}/skill/`],
      numberOfRuns: 3,
      settings: {
        // Lighthouse's defaults, stated because they're the point: a throttled phone.
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        chromeFlags: '--no-sandbox',
        // main's build carries the analytics beacon, and test runs mustn't count as readers.
        blockedUrlPatterns: ['static.cloudflareinsights.com'],
      },
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        // The JS-size cap comes in phase 2, set from bake-off 1's measurements (S1).
      },
    },
    upload: { target: 'filesystem', outputDir: 'lighthouse-reports' },
  },
};
