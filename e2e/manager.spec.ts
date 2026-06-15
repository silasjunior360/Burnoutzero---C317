import { test, expect } from '@playwright/test';

test.describe('Manager Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept user auth me
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

    // Intercept gamification
    await page.route('**/gamification/my-points/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_points: 0, history: [] }),
      });
    });

    // Intercept Team Overview API
    await page.route('**/manager/team-overview/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recent_alerts: [
            { assessment_date: '2026-05-31T20:00:00Z', employee__username: 'troubled_emp' }
          ],
          team_members: [
            { id: 10, username: 'troubled_emp', first_name: 'Troubled', last_name: 'Employee', role: 'employee' },
            { id: 11, username: 'free_emp', first_name: 'Free', last_name: 'Employee', role: 'employee' }
          ],
          total_team_members: 2,
          averages: {
            avg_stress: 40,
            avg_anxiety: 45,
            avg_burnout: 30,
            avg_depression: 35
          }
        }),
      });
    });

    // Intercept Sectors API
    let sectorList = [
      {
        id: 1,
        setor: 'Tecnologia',
        engajamento: 80,
        saude: 'Ótimo',
        alertas: 1,
        usuarios: ['troubled_emp'],
        usuarios_detalhes: [
          { id: 10, username: 'troubled_emp', first_name: 'Troubled', last_name: 'Employee', role: 'employee', engajamento: 80, saude: 'Ótimo', alerta: true }
        ]
      }
    ];

    await page.route('**/manager/sectors/', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const newSec = {
          id: 2,
          setor: payload.setor || 'Novo Setor',
          engajamento: 100,
          saude: 'Ótimo',
          alertas: 0,
          usuarios: [],
          usuarios_detalhes: []
        };
        sectorList.push(newSec);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newSec),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(sectorList),
        });
      }
    });

    await page.route('**/manager/sectors/1/assign/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Assigned' }),
      });
    });

    // Mock access token in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('access_token', 'mock-access');
      window.localStorage.setItem('user_role', 'manager');
    });

    await page.goto('/manager');
  });

  test('should display dashboard stats and metrics', async ({ page }) => {
    // Assert summary stats
    await expect(page.locator('text=Total de Usuários')).toBeVisible();
    await expect(page.locator('.MuiTypography-h4', { hasText: '2' })).toBeVisible(); // from total_team_members

    await expect(page.locator('text=Desempenho Semanal Médio')).toBeVisible();
    await expect(page.locator('text=80%')).toBeVisible();

    await expect(page.locator('text=Alertas Ativos')).toBeVisible();
    await page.click('text=Alertas Ativos');
    await expect(page.locator('text=Troubled Employee (troubled_emp)')).toBeVisible();
  });

  test('should toggle team member details list', async ({ page }) => {
    await page.click('text=Total de Usuários');

    // Collapsible detail list should show up
    await expect(page.locator('text=Colaboradores da sua empresa')).toBeVisible();
    await expect(page.locator('text=Troubled Employee')).toBeVisible();
    await expect(page.locator('.MuiChip-label', { hasText: 'Free Employee' })).toBeVisible();
  });

  test('should allow creating a new sector', async ({ page }) => {
    await page.click('button:has-text("Criar setor")');

    // Dialog opens
    await expect(page.locator('h2:has-text("Criar setor")')).toBeVisible();
    await page.fill('label:has-text("Nome do setor") + div input', 'Marketing');
    await page.click('div[role="dialog"] button:has-text("Criar")');

    // Confirm new sector in table
    await page.click('button:has-text("Setores")');
    await expect(page.getByText('Marketing', { exact: true })).toBeVisible();
  });

  test('should assign an unassigned member to a sector', async ({ page }) => {
    // Go to unassigned members tab
    await page.click('button:has-text("Sem setor")');

    // Select input for assigning "free_emp" to "Tecnologia"
    await page.locator('div[role="combobox"]').first().click();
    await page.click('li[role="option"]:has-text("Tecnologia")');

    // Check backend trigger completes assignment (it fetches sectors again)
    await expect(page.locator('button:has-text("Sem setor (")')).toBeVisible();
  });
});
