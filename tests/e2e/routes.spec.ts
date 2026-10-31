import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Every page in the build, found from its output, so adding a page adds its checks (#5).
const site = fileURLToPath(new URL('../../dist/skill', import.meta.url));
const routes = readdirSync(site, { recursive: true, encoding: 'utf8' })
  .filter((file) => file === 'index.html' || file.endsWith('/index.html'))
  .map((file) => `./${file.slice(0, -'index.html'.length)}`);

test('the build has a home page to check', () => {
  expect(routes).toContain('./');
});

for (const route of routes) {
  test(`${route} has noindex and no axe violations`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-robots-tag']).toBe('noindex');
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
