import { test, expect } from '@playwright/test';

test.describe('Visual Regression E2E Tests', () => {
  test('should match landing page screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Transforme a saúde mental da sua empresa');

    await expect(page).toHaveScreenshot('landing-page.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match login page screenshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('button:has-text("Entrar")');

    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match register page screenshot', async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector('button:has-text("Próximo")');

    await expect(page).toHaveScreenshot('register-page.png', {
      maxDiffPixels: 100,
    });
  });
});
