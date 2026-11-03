import { execFile } from 'node:child_process';
import { cp, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, expect, it } from 'vitest';

// Phase 4's contending themes (#85) are only in a build made with THEMES=yes. This builds a copy of the site
// both ways, and checks the themes are in one and nowhere in the other, so the check can't pass by looking for
// the wrong thing. The copy sits inside the repo so Node finds node_modules.
const run = promisify(execFile);
const root = '.themes-test';
const traces = [/devTheme/, /dev-theme/, /data-house/, /Fraunces/, /Jost/, /fraunces|jost/i];

async function build(themes: boolean) {
  const env = { ...process.env, THEMES: themes ? 'yes' : '' };
  await rm(join(root, 'dist'), { recursive: true, force: true });
  await run(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--root', root], {
    env,
  });
  const files = await readdir(join(root, 'dist'), { recursive: true, withFileTypes: true });
  const built = files.filter((file) => file.isFile());
  const texts = await Promise.all(
    built
      .filter((file) => /\.(html|css|js)$/.test(file.name))
      .map((file) => readFile(join(file.parentPath, file.name), 'utf8')),
  );
  return { names: built.map((file) => file.name), texts };
}

beforeAll(async () => {
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  for (const file of ['astro.config.mjs', 'tsconfig.json', 'package.json', 'src', 'content']) {
    await cp(file, join(root, file), { recursive: true });
  }
});

afterAll(() => rm(root, { recursive: true, force: true }));

it('a build with THEMES=yes has the themes, their fonts and the switcher', async () => {
  const { names, texts } = await build(true);
  for (const trace of traces) {
    expect(
      [...names, ...texts].some((text) => trace.test(text)),
      String(trace),
    ).toBe(true);
  }
});

it('a build without it has none of them', async () => {
  const { names, texts } = await build(false);
  expect(names).toContain('index.html');
  for (const trace of traces) {
    expect(
      names.filter((name) => trace.test(name)),
      String(trace),
    ).toEqual([]);
    expect(texts.filter((text) => trace.test(text)).length, String(trace)).toBe(0);
  }
});
