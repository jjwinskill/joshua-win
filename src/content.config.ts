import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Josh's private drafts (#9), read only by `astro dev`. Every build gets an empty collection, so no
// draft can reach dist/. Phase 6's local soft-launch build (G22) will add its own explicit switch
// here, one that CI can't turn on.
const drafts = defineCollection({
  loader: import.meta.env.DEV ? glob({ pattern: '**/*.md', base: './drafts' }) : () => [],
  schema: z.object({ title: z.string().optional() }),
});

export const collections = { drafts };
