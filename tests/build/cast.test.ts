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

it('a component given a cast id doesn’t count as a mention, since it might not render it', async () => {
  await copySite();
  const piece = join(root, 'content', 'lorem', 'ut-labore.mdx');
  const wrapped = (await readFile(piece, 'utf8')).replace(
    '<span id="cast-queen">The Queen of Hearts</span>',
    '<ScrollTally id="cast-queen" />',
  );
  await writeFile(piece, wrapped);

  await expect(build()).rejects.toMatchObject({
    stderr: expect.stringContaining('"queen" has no mention'),
  });
}, 60_000);

it('a piece with no cast builds with no parade, cast list or space on its card', async () => {
  await copySite();
  await build();
  const dist = join(root, 'dist', 'skill');
  const page = await readFile(join(dist, 'write-ups', 'excepteur-sint', 'index.html'), 'utf8');
  expect(page).toContain('Excepteur sint occaecat');
  expect(page).not.toContain('astro-island');
  expect(page).not.toContain('cast-section');
  const home = await readFile(join(dist, 'index.html'), 'utf8');
  const card = home.slice(home.indexOf('href="/skill/write-ups/excepteur-sint/"'));
  expect(card.slice(0, card.indexOf('</a>'))).not.toContain('piece-card-cast');
}, 60_000);

it('a cast with no cited work fails the build', async () => {
  await copySite();
  const piece = join(root, 'content', 'lorem', 'lorem-ipsum.md');
  await writeFile(piece, (await readFile(piece, 'utf8')).replace(/citedWork:\n.*\n.*\n/, ''));
  await expect(build()).rejects.toMatchObject({
    stderr: expect.stringContaining('A piece with a cast needs a cited work'),
  });
}, 60_000);

it('a bad run file fails the build, and says what’s wrong', async () => {
  await copySite();
  const file = join(root, 'src', 'content', 'run.json');
  await writeFile(file, (await readFile(file, 'utf8')).replace('"name": "Lorem"', '"name": ""'));
  await expect(build()).rejects.toMatchObject({
    stderr: expect.stringMatching(/run file has 1 problem[\s\S]*stages\[0\]\.name/),
  });
}, 60_000);
