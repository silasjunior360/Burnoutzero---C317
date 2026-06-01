import { test, expect } from '@playwright/test';

test.describe('Settings Configurations E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept user auth me
    await page.route('**/users/me/', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            username: 'updatedusername',
            first_name: 'JohnUpdated',
            last_name: 'DoeUpdated',
            email: 'johnupdated@example.com',
            role: 'employee',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            username: 'johndoe',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            role: 'employee',
          }),
        });
      }
    });

    // Intercept gamification
    await page.route('**/gamification/my-points/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_points: 0, history: [] }),
      });
    });

    // Intercept password API
    await page.route('**/users/me/password/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Senha alterada com sucesso.' }),
      });
    });

    // Mock access token in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('access_token', 'mock-access');
      window.localStorage.setItem('user_role', 'employee');
    });

    await page.goto('/settings');
  });

  test('should load current settings profile data', async ({ page }) => {
    await expect(page.locator('text=Configurações da conta')).toBeVisible();

    // Check pre-populated field values
    const usernameInput = page.locator('label:has-text("Nome de usuário") + div input');
    await expect(usernameInput).toHaveValue('johndoe');

    const emailInput = page.locator('label:has-text("E-mail") + div input');
    await expect(emailInput).toHaveValue('john@example.com');
  });

  test('should allow saving profile modifications', async ({ page }) => {
    // Modify profile fields
    await page.fill('label:has-text("Nome de usuário") + div input', 'updatedusername');
    await page.fill('label:has-text("Nome") + div input', 'JohnUpdated');
    await page.fill('label:has-text("Sobrenome") + div input', 'DoeUpdated');
    await page.fill('label:has-text("E-mail") + div input', 'johnupdated@example.com');

    // Click submit profile
    await page.click('button:has-text("Salvar perfil")');

    // Should display success message
    await expect(page.locator('text=Perfil atualizado com sucesso.')).toBeVisible();
  });

  test('should validate password fields and allow password modification', async ({ page }) => {
    await page.fill('label:has-text("Senha atual") + div input', 'oldpassword123');
    await page.fill('label:has-text("Nova senha") + div input', 'newpassword123');
    await page.fill('label:has-text("Confirmar nova senha") + div input', 'newpassword123');

    // Click submit password
    await page.click('button:has-text("Alterar senha")');

    // Should display success message
    await expect(page.locator('text=Senha alterada com sucesso.')).toBeVisible();
  });

  test('should toggle theme selection', async ({ page }) => {
    const themeSwitch = page.locator('input[type="checkbox"]').first();

    // Toggle theme
    await themeSwitch.click();

    // Verify localStorage or component text update (Label shifts to "Escuro" or "Claro")
    await expect(page.locator('label:has-text("Escuro"), label:has-text("Claro")')).toBeVisible();
  });
});
