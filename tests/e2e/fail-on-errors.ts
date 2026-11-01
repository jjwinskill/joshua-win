import type { Page } from '@playwright/test';

/** Collects the page's errors. Use it in any test that checks for them, because only main's build has the beacon. */
export function failOnErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    // playwright.config.ts blocks main's analytics beacon, so that failed load isn't the page's error.
    if (message.type() === 'error' && !message.location().url.includes('cloudflareinsights')) {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}
