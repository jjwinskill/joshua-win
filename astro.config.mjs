// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Static output, served by a hand-written Cloudflare Worker (no adapter).
// `base` and `trailingSlash` must match the Worker's `assets.base_path` and Cloudflare's
// default `auto-trailing-slash` HTML handling. See issue #1.
export default defineConfig({
  site: 'https://joshua.win',
  base: '/skill',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react()],
});
