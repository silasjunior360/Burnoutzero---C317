import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (a11y) E2E Tests', () => {
  test('landing page should not have any automatically detectable accessibility violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Transforme a saúde mental da sua empresa');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('button:has-text("Entrar")');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('register page should not have accessibility violations', async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector('button:has-text("Próximo")');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
