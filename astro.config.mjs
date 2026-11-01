// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Drafts exist under `astro dev` only (#9). Keyed on the command, because `import.meta.env.DEV` can
// be true in a build (NODE_ENV=development). No build has the route or the collection's contents.
/** @type {import('astro').AstroIntegration} */
const draftsInDev = {
  name: 'drafts-in-dev',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      process.env.LOAD_DRAFTS = command === 'dev' ? 'yes' : 'no';
      if (command === 'dev') {
        injectRoute({ pattern: '/drafts/[...slug]', entrypoint: './src/dev/drafts.astro' });
        injectRoute({ pattern: '/template-sheet', entrypoint: './src/dev/template-sheet.astro' });
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
