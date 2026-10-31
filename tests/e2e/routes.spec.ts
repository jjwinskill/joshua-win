import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Every page in the build, found from its output, so adding a page adds its checks (#5).
const site = fileURLToPath(new URL('../../dist/skill', import.meta.url));
const routes = readdirSync(site, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.html'))
  .map((file) => `./${file.replace(/(index)?\.html$/, '')}`);

test('the build has a home page to check', () => {
  expect(routes).toContain('./');
});

for (const route of routes) {
  test(`${route} has noindex and no axe violations`, async ({ page }) => {
    const response = await page.goto(route);
    // Under 500, not 200: a custom 404 page may answer with its own status.
    expect(response?.status()).toBeLessThan(500);
    expect(response?.headers()['x-robots-tag']).toBe('noindex');
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
  });
}
