// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Drafts render under `astro dev` only (#9), so no build has this route.
/** @type {import('astro').AstroIntegration} */
const draftsInDev = {
  name: 'drafts-in-dev',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'dev') {
        injectRoute({ pattern: '/drafts/[...slug]', entrypoint: './src/dev/drafts.astro' });
      }
    },
  },
};

// Static output, served by a hand-written Cloudflare Worker (no adapter).
// `base` and `outDir` must agree: Wrangler serves dist/, so files in dist/skill/ are at /skill/.
// `trailingSlash` must match Cloudflare's default `auto-trailing-slash` HTML handling. See issue #1.
export default defineConfig({
  site: 'https://joshua.win',
  base: '/skill',
  outDir: './dist/skill',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react(), draftsInDev],
});
