import { execFile } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterAll, expect, it } from 'vitest';

// Builds a copy of the site with a mention removed, proving a cast list can't ship a dead link. Like
// the drafts test, the copy sits inside the repo so Node finds node_modules.
const run = promisify(execFile);
const root = '.cast-test';

afterAll(() => rm(root, { recursive: true, force: true }));

async function copySite() {
  await rm(root, { recursive: true, force: true });
  await mkdir(root);
  for (const file of ['astro.config.mjs', 'tsconfig.json', 'package.json', 'src', 'content']) {
    await cp(file, join(root, file), { recursive: true });
  }
}

const build = () =>
  run(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--root', root]);

it('astro build fails when a listed cast member has no mention', async () => {
  await copySite();
  const piece = join(root, 'content', 'lorem', 'lorem-ipsum.md');
  await writeFile(piece, (await readFile(piece, 'utf8')).replace('id="cast-queen"', ''));

  await expect(build()).rejects.toMatchObject({
    stderr: expect.stringContaining('"queen" has no mention'),
  });
}, 60_000);

it('the mentions check holds in MDX, where a marker quoted in code doesn’t count', async () => {
  await copySite();
  const piece = join(root, 'content', 'lorem', 'ut-labore.mdx');
  const quoted = (await readFile(piece, 'utf8')).replace(
    '<span id="cast-queen">The Queen of Hearts</span>',
    '`<span id="cast-queen">`',
  );
  await writeFile(piece, quoted);

  await expect(build()).rejects.toMatchObject({
    stderr: expect.stringContaining('"queen" has no mention'),
  });
}, 60_000);
