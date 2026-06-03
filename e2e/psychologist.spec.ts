import { test, expect } from '@playwright/test';

test.describe('Psychologist Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept user auth me
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

    // Intercept gamification
    await page.route('**/gamification/my-points/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total_points: 0, history: [] }),
      });
    });

    // Intercept psychologist dashboard stats
    await page.route('**/psychologist/dashboard/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_patients: 1,
          active_patients: 1,
          improving_count: 0,
          attention_count: 1,
          monthly_appointments: 1,
          pending_insights: 1,
        }),
      });
    });

    // Intercept psychologist follow-ups list
    await page.route('**/follow-ups/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            employee: { id: 10, username: 'johndoe', first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
            date: '2026-05-30T10:00:00Z',
            status: 'active',
            private_notes: 'Anotações sobre progresso.',
          }
        ]),
      });
    });

    // Intercept insights list
    await page.route('**/insights/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 42,
            text: 'Risco de estresse elevado identificado.',
            recommendations: 'Reduzir carga de trabalho.',
            generated_at: '2026-05-30T10:00:00Z',
            validated_at: null,
            validated_by: null,
            employee: 10,
            assessment: 100,
          }
        ]),
      });
    });

    // Intercept appointments list
    await page.route('**/appointments/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            employee: { id: 10, username: 'johndoe', first_name: 'John', last_name: 'Doe' },
            psychologist_name: 'Dra. Ana Silva',
            date_time: '10:30',
            status: 'scheduled'
          }
        ]),
      });
    });

    // Intercept assessments list
    await page.route('**/assessments/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 100, employee: 10, stress: 80, anxiety: 65, burnout: 55, depression: 40, risk_level: 'high', assessment_date: '2026-05-30T10:00:00Z' }
        ]),
      });
    });

    // Intercept Insight Validation API
    await page.route('**/insights/42/validate/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Validated successfully' }),
      });
    });

    // Mock access token in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('access_token', 'mock-access');
      window.localStorage.setItem('user_role', 'psychologist');
    });

    await page.goto('/psychologist');
  });

  test('should display dashboard statistics and high risk alert banner', async ({ page }) => {
    // Assert summary statistics are present
    await expect(page.locator('text=Total de Pacientes')).toBeVisible();
    await expect(page.locator('text=1').first()).toBeVisible(); // Total de Pacientes value
    await expect(page.locator('text=Insights pendentes')).toBeVisible();

    // Check alert banner warning about high risk patients
    await expect(page.locator('text=1 paciente com indicadores de alto risco aguardando atenção')).toBeVisible();
  });

  test('should open patient detail modal and show assessments history', async ({ page }) => {
    // Click on patient row to view detail modal
    await page.click('text=John Doe');

    // Dialog should open
    await expect(page.locator('h2')).toContainText('John Doe');

    // Check detailed metrics inside the dialog context specifically to avoid strict mode violations
    await expect(page.locator('h6:has-text("Última avaliação")')).toBeVisible();
    await expect(page.locator('.MuiDialog-root').locator('text=Estresse').first()).toBeVisible();
  });

  test('should validate a pending insight through editing dialog', async ({ page }) => {
    // Open patient detail modal
    await page.click('text=John Doe');

    // Switch to Insights tab
    await page.click('button[role="tab"]:has-text("Insights")');

    // Edit button should be visible (represented by an edit icon in the row)
    await page.locator('button[aria-label="Analisar e validar"]').click();

    // Dialog "Validar Insight" should open
    await expect(page.locator('text=Validar Insight')).toBeVisible();

    // Make edits and save/validate
    await page.click('button:has-text("Salvar e Validar")');

    // Success snackbar inside modal shows "Insight validado!"
    await expect(page.locator('text=Insight validado!')).toBeVisible();
  });

  test('should switch to agenda tab and view appointments', async ({ page }) => {
    // Switch to agenda tab
    await page.click('button[role="tab"]:has-text("Minha Agenda")');

    // Check scheduled appointments heading
    await expect(page.locator('text=Minha Agenda de Consultas')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
  });
});
