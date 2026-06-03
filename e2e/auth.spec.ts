import { test, expect } from '@playwright/test';

test.describe('Authentication & Landing Page E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept login and registration endpoints
    await page.route('**/auth/login/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access: 'mock-access-token',
          refresh: 'mock-refresh-token',
        }),
      });
    });

    await page.route('**/auth/register/', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User created' }),
      });
    });

    await page.route('**/gamification/my-points/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_points: 0, history: [] }),
      });
    });
  });

  test('should navigate to landing page and show features', async ({ page }) => {
    await page.goto('/');
    
    // Check main title on landing page
    await expect(page.locator('text=Transforme a saúde mental da sua empresa')).toBeVisible();
    
    // Check if CTAs exist (first Login link)
    const ctaButton = page.locator('a:has-text("Login")').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should register a new employee user through multi-step form', async ({ page }) => {
    await page.goto('/register');

    // Handle the browser alert dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Cadastro realizado com sucesso');
      await dialog.accept();
    });

    // Step 1: Personal Data
    await page.fill('input[name="nome"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="usuario"]', 'johndoe');
    await page.fill('input[name="senha"]', 'password123');
    await page.fill('input[name="confirmarSenha"]', 'password123');
    await page.click('button:has-text("Próximo")');

    // Step 2: Role selection (defaults to employee)
    await page.click('button:has-text("Próximo")');

    // Step 3: Terms of Service
    await page.locator('input[type="checkbox"]').check();
    await page.click('button:has-text("Finalizar Cadastro")');

    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should login as employee and redirect to employee dashboard', async ({ page }) => {
    // Intercept user me endpoint to return employee role
    await page.route('**/users/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'johndoe',
          email: 'john@example.com',
          role: 'employee',
        }),
      });
    });

    await page.goto('/login');

    await page.fill('input[placeholder="seu@exemplo.com"]', 'johndoe@example.com');
    await page.fill('input[placeholder="••••••••"]', 'password123');
    await page.click('button:has-text("Entrar")');

    // Redirect to home or employee page (the app redirects based on role to /home, /manager or /psychologist)
    await expect(page).toHaveURL(/\/home/);
  });

  test('should login as manager and redirect to manager dashboard', async ({ page }) => {
    // Intercept user me endpoint to return manager role
    await page.route('**/users/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          username: 'managerjohndoe',
          email: 'manager@example.com',
          role: 'manager',
        }),
      });
    });

    await page.goto('/login');

    await page.fill('input[placeholder="seu@exemplo.com"]', 'manager@example.com');
    await page.fill('input[placeholder="••••••••"]', 'password123');
    await page.click('button:has-text("Entrar")');

    // Redirect to manager page
    await expect(page).toHaveURL(/\/manager/);
  });

  test('should login as psychologist and redirect to psychologist dashboard', async ({ page }) => {
    // Intercept user me endpoint to return psychologist role
    await page.route('**/users/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 3,
          username: 'psyjohndoe',
          email: 'psychologist@example.com',
          role: 'psychologist',
        }),
      });
    });

    await page.goto('/login');

    await page.fill('input[placeholder="seu@exemplo.com"]', 'psyjohndoe@example.com');
    await page.fill('input[placeholder="••••••••"]', 'password123');
    await page.click('button:has-text("Entrar")');

    // Redirect to psychologist page
    await expect(page).toHaveURL(/\/psychologist/);
  });
});
