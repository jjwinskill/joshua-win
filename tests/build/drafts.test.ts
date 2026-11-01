import { execFile } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, expect, it } from 'vitest';

// Builds a copy of the site with a lorem drafts folder, so it never touches a real drafts/. The copy
// sits inside the repo so Node finds node_modules, and has its own Astro cache.
const run = promisify(execFile);
const root = '.drafts-test';
const dist = join(root, 'dist');
const marker = 'lorem-draft-marker';

beforeAll(async () => {
  await rm(root, { recursive: true, force: true });
  await mkdir(join(root, 'drafts'), { recursive: true });
  for (const file of ['astro.config.mjs', 'tsconfig.json', 'package.json', 'src', 'content']) {
    await cp(file, join(root, file), { recursive: true });
  }
  await writeFile(join(root, 'drafts', 'lorem.md'), `---\ntitle: Lorem\n---\n\n${marker}\n`);
  // An MDX draft with a one-off that hydrates, the way Josh's real pieces may use it (S15).
  await writeFile(
    join(root, 'drafts', 'one-off.tsx'),
    `export const OneOff = () => <p>${marker}-component</p>;\n`,
  );
  await writeFile(
    join(root, 'drafts', 'with-one-off.mdx'),
    `---\ntitle: Lorem MDX\n---\n\nimport { OneOff } from './one-off';\n\n${marker}-mdx\n\n<OneOff client:load />\n`,
  );
  // A public page that prints the collection, so the test sees it if a build ever loads drafts.
  await writeFile(
    join(root, 'src', 'pages', 'reads-collection.astro'),
    `---\nimport { getCollection } from 'astro:content';\nconst drafts = await getCollection('drafts');\n---\n<p>{drafts.map((draft) => draft.body)}</p>\n`,
  );
});

afterAll(() => rm(root, { recursive: true, force: true }));

it('astro build leaves drafts, MDX ones too, and the template sheet out, even with the drafts folder present', async () => {
  // NODE_ENV=development is the risky case: it makes import.meta.env.DEV true in a build.
  await run(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--root', root], {
    env: { ...process.env, NODE_ENV: 'development' },
  });
  const files = await readdir(dist, { recursive: true, withFileTypes: true });
  const built = files.filter((file) => file.isFile());
  expect(built.map((file) => file.name)).toContain('index.html');
  expect(await readFile(join(dist, 'skill', 'reads-collection', 'index.html'), 'utf8')).toContain(
    '<p>',
  );
  for (const file of built) {
    const path = join(file.parentPath, file.name);
    expect(relative(dist, path)).not.toContain('drafts');
    expect(relative(dist, path)).not.toContain('template-sheet');
    const contents = await readFile(path, 'utf8');
    expect(contents, path).not.toContain(marker);
    expect(contents, path).not.toContain('Cast template sheet');
  }
}, 60_000);
