// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Static output, served by a hand-written Cloudflare Worker (no adapter).
// `base` and `outDir` must agree: Wrangler serves dist/, so files in dist/skill/ are at /skill/.
// `trailingSlash` must match Cloudflare's default `auto-trailing-slash` HTML handling. See issue #1.
export default defineConfig({
  site: 'https://joshua.win',
  base: '/skill',
  outDir: './dist/skill',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react()],
});
