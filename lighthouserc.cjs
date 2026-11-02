// Lighthouse CI on the built site through the real Worker (#5). Checked against @lhci/cli 0.15.1
// (Lighthouse 12.6.1) on 2026-10-30. Run `pnpm build` first. Port 8788 is Playwright's.
const port = 8789;
// The default is the best of the three runs, which would hide a page that's usually slow.
const aggregationMethod = 'median';
// CI's fast gate runs the heavy page once. A checkpoint (G38) runs every page three times.
const full = process.env.LIGHTHOUSE_FULL === 'yes';
const heavyPage = `http://127.0.0.1:${port}/skill/essays/amet-consectetur/`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `WRANGLER_SEND_METRICS=false pnpm exec wrangler dev --port ${port} --ip 127.0.0.1`,
      startServerReadyPattern: 'Ready on',
      url: full
        ? [
            `http://127.0.0.1:${port}/skill/`,
            `http://127.0.0.1:${port}/skill/essays/lorem-ipsum/`,
            `http://127.0.0.1:${port}/skill/contents/`,
            heavyPage,
            `http://127.0.0.1:${port}/skill/essays/ut-labore/`,
            `http://127.0.0.1:${port}/skill/write-ups/excepteur-sint/`,
          ]
        : [heavyPage],
      numberOfRuns: full ? 3 : 1,
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
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod }],
        'total-blocking-time': ['error', { maxNumericValue: 200, aggregationMethod }],
      },
    },
    upload: { target: 'filesystem', outputDir: 'lighthouse-reports' },
  },
};
