// `pnpm check:selected`: what must pass locally before a PR auto-merges (G48). The mechanical checks,
// all the unit tests, a build, and the Playwright specs that cover the paths this branch changes.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { selectSpecs } from './select-e2e.ts';

const output = (command: string) => execSync(command, { encoding: 'utf8' });
const lines = (text: string) => text.split('\n').filter(Boolean);
const run = (command: string) => execSync(command, { stdio: 'inherit' });

output('git fetch -q origin main');
const base = output('git merge-base origin/main HEAD').trim();
const changed = [
  ...lines(output(`git diff --name-only ${base}`)),
  ...lines(output('git ls-files --others --exclude-standard')),
];
const specs = selectSpecs(changed);
console.log(
  `${changed.length} changed files. Specs: ${specs === 'all' ? 'all' : specs.join(', ')}`,
);

for (const command of ['typecheck', 'lint', 'format:check', 'test', 'build'])
  run(`pnpm ${command}`);
// A spec this branch deleted is in the list, and is no longer there to run.
const files =
  specs === 'all'
    ? ''
    : specs
        .map((spec) => `tests/e2e/${spec}.spec.ts`)
        .filter((file) => existsSync(file))
        .join(' ');
run(`pnpm exec playwright test ${files}`);
