# Local development

How to run, check and test the site locally. Read [`pnpm.md`](pnpm.md) first. Checked against Astro 7.4.4, Vitest 5.0.5, ESLint 10.13.0 and Prettier 3.9.10 on 2026-10-29. Later phase 1 tickets extend this file: serving through the Worker (#3), the invite gate's test secret and rotation (#4), and drafts (#9).

## The stack, briefly

- **Astro 7**, static output, with React for every component. Astro renders `.astro` pages and React components to plain HTML at build time. A React component ships JavaScript only when a page opts in with a `client:*` directive, and the hello page has none.
- The site lives under **`base: '/skill'`** with trailing slashes always on. Never hard-code a leading `/` in a link; use `sitePath()` from `src/lib/paths.ts` (or `import.meta.env.BASE_URL`), or the link escapes `/skill/`.
- There's **no Cloudflare adapter**. A hand-written Worker will sit in front of the built files (#3).

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Installs dependencies and the pinned Node 26 |
| `pnpm dev` | Dev server with hot reload at http://localhost:4321/skill/ |
| `pnpm build` | Static build into `dist/` |
| `pnpm preview` | Serves `dist/` with Astro's server (no Worker; for a quick look only) |
| `pnpm typecheck` | `astro check`: TypeScript across `.astro`, `.ts` and `.tsx` |
| `pnpm lint` | ESLint (typescript-eslint, the Astro plugin, jsx-a11y) |
| `pnpm format` / `pnpm format:check` | Prettier, writing or checking. Markdown and `docs/` are excluded, so prose is never reflowed. |
| `pnpm test` / `pnpm test:watch` | Vitest: unit and component tests |

CI (`.github/workflows/ci.yml`) runs typecheck, lint and format check, then the tests, then the build, each job only if the one before it passed. Run the same commands locally before opening a PR.

## Folders

| Folder | Holds |
|---|---|
| `src/pages/` | Routes. `index.astro` is `/skill/`. |
| `src/layouts/` | Page shells (`Base.astro`) |
| `src/components/` | The shared React component library. No Astro or framework APIs, so the bake-off can reuse it in Next. |
| `src/lib/` | Plain TypeScript helpers |
| `src/content/` | Content that lives with the code (later phases). Collections are configured in `src/content.config.ts`, not `src/content/config.ts`, which is Astro's deprecated legacy path. |
| `content/lorem/` | Lorem pieces, free to edit |

## Tests

- **Unit tests** are `src/**/*.test.ts` and run in Node. The example is `src/lib/paths.test.ts`.
- **Component tests** are `src/**/*.test.tsx` and run in jsdom with Testing Library and the jest-dom matchers. The example is `src/components/Greeting.test.tsx`. Test what a reader sees (roles, text), not internals. `.astro` files aren't component-tested, because Astro's Container API is still experimental (`experimental_AstroContainer` in Astro 7.4.4); Playwright covers them through the built site.
- Under Vitest, `import.meta.env.BASE_URL` is `/`, not `/skill/`, so pass the base explicitly in unit tests.
