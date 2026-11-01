import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { castKeys } from './components/cast/registry';

// Josh's private drafts (#9), read only by `astro dev` (astro.config.mjs sets the variable from the
// command). Every build gets an empty collection, so no draft can reach dist/. Phase 6's local soft-launch build (G22) will add its own explicit switch
// here, one that CI can't turn on.
const drafts = defineCollection({
  loader:
    process.env.LOAD_DRAFTS === 'yes'
      ? glob({ pattern: '**/*.{md,mdx}', base: './drafts' })
      : () => [],
  schema: z.object({ title: z.string().optional() }),
});

// Lorem pieces test the stack and styling, and are removed before publishing.
const lorem = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './content/lorem' }),
  schema: z.object({
    title: z.string(),
    dek: z.string(),
    date: z.date(),
    citedWork: z.object({ title: z.string(), author: z.string() }),
    cast: z
      .array(z.enum(castKeys))
      .max(4)
      .refine((cast) => new Set(cast).size === cast.length, 'A cast member is listed twice.'),
  }),
});

export const collections = { drafts, lorem };
