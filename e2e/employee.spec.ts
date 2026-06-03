import { test, expect } from '@playwright/test';

test.describe('Employee Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
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

    await page.route('**/assessments/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 1, stress: 30, anxiety: 40, burnout: 15, depression: 20 }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, stress: 30, anxiety: 40, burnout: 15, depression: 20, risk_level: 'low', assessment_date: '2026-05-31T20:00:00Z' }
          ]),
        });
      }
    });

    await page.route('**/insights/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, text: 'Níveis saudáveis identificados.', recommendations: 'Continue assim.', generated_at: '2026-05-31T20:00:00Z' }
        ]),
      });
    });

    await page.route('**/gamification/my-points/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          total_points: 120,
          history: [
            { points: 50, reason: 'assessment_complete', earned_at: '2026-05-31T20:00:00Z' }
          ]
        }),
      });
    });

    await page.route('**/appointments/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 10, psychologist_name: 'Dra. Ana Silva', date_time: '14:00', status: 'scheduled' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    await page.route('**/appointments/taken_slots/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.route('**/users/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 2, username: 'anasilva', first_name: 'Dra. Ana', last_name: 'Silva', role: 'psychologist', department: 'Especialista em Burnout' }
        ]),
      });
    });

    // Mock access token in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('access_token', 'mock-access');
      window.localStorage.setItem('user_role', 'employee');
    });

    await page.goto('/employee');
  });

  test('should render dashboard metrics and values correctly', async ({ page }) => {
    // Assert metrics values mapped from assessments mock
    await expect(page.locator('text=Estresse')).toBeVisible();
    await expect(page.locator('.MuiTypography-h4', { hasText: '30' })).toBeVisible();
    await expect(page.locator('text=Ansiedade')).toBeVisible();
    await expect(page.locator('.MuiTypography-h4', { hasText: '40' })).toBeVisible();
    await expect(page.locator('text=120 pontos')).toBeVisible();
  });

  test('should allow filling and submitting a new assessment', async ({ page }) => {
    await page.click('button:has-text("Nova Avaliação")');

    // Dialog should open
    await expect(page.locator('text=Como você está se sentindo?')).toBeVisible();

    // Fill the assessment inputs
    await page.fill('label:has-text("Estresse") + div input', '25');
    await page.fill('label:has-text("Ansiedade") + div input', '30');
    await page.fill('label:has-text("Burnout") + div input', '10');
    await page.fill('label:has-text("Depressão") + div input', '15');

    // Click submit
    await page.click('button:has-text("Enviar Avaliação")');

    // Check Snackbar success feedback
    await expect(page.locator('text=Avaliação enviada com sucesso!')).toBeVisible();
  });

  test('should schedule an appointment with a psychologist', async ({ page }) => {
    // The psychologist list shows Dra. Ana Silva
    await expect(page.locator('text=Dra. Ana Silva')).toBeVisible();

    // Find and click the appointment hour button (e.g. 09:00 or 14:00)
    await page.click('button:has-text("14:00")');

    // Confirm dialog should open
    await expect(page.locator('h2:has-text("Confirmar Agendamento")')).toBeVisible();

    // Confirm schedule
    await page.click('button:has-text("Confirmar Agendamento")');

    // Check Snackbar success feedback
    await expect(page.locator('text=Consulta agendada com Dra. Ana Silva para 14:00.')).toBeVisible();
  });

  test('should interact with the AI Chat', async ({ page }) => {
    // Intercept AI API as a stream response
    await page.route('**/ai/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: `data: {"chunk": "Olá, sou o assistente virtual do BurnoutZero."}\n\ndata: [DONE]\n\n`,
      });
    });

    await page.click('button:has-text("Chat de Acolhimento")');

    // Chat pane should show up
    await expect(page.locator('text=Assistente de Acolhimento')).toBeVisible();

    // Type and send a message
    await page.fill('input[placeholder="Digite sua mensagem..."]', 'Estou um pouco cansado.');
    await page.press('input[placeholder="Digite sua mensagem..."]', 'Enter');

    // Assert that the mocked AI response message appears
    await expect(page.locator('text=Olá, sou o assistente virtual do BurnoutZero')).toBeVisible();
  });
});
