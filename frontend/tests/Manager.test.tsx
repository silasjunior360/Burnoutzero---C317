import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Manager from '../pages/Manager';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedGet = api.get as MockedFunction<typeof api.get>;

describe('Manager Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and display manager metrics and alerts', async () => {
    mockedGet.mockImplementation((url: string): Promise<unknown> => {
      if (url === '/manager/team-overview/') {
        return Promise.resolve({
          data: {
            recent_alerts: [
              {
                assessment_date: '2026-05-29T10:00:00Z',
                employee__username: 'emp_alert',
              },
            ],
            averages: {
              avg_stress: 42.5,
              avg_anxiety: 15.0,
              avg_burnout: 30.2,
              avg_depression: 5.1,
            },
          },
        });
      }
      if (url === '/users/me/') {
        return Promise.resolve({
          data: {
            username: 'gestor',
            role: 'manager',
            department: 'TI',
          },
        });
      }
      if (url === '/manager/sectors/') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              setor: 'Operações',
              engajamento: 42,
              saude: 'Bom',
              alertas: 1,
              usuarios: ['emp_alert'],
              usuarios_detalhes: [
                {
                  id: 10,
                  username: 'emp_alert',
                  first_name: 'Ana',
                  last_name: 'Silva',
                  role: 'employee',
                  engajamento: 42,
                  saude: 'Bom',
                  alerta: true,
                },
              ],
            },
          ],
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter>
        <Manager />
      </MemoryRouter>
    );

    expect(api.get).toHaveBeenCalledWith('/manager/team-overview/');

    await waitFor(() => {
      expect(screen.getByText(/Alertas Ativos/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Total de Usuários')).toBeInTheDocument();
    expect(screen.getByText('Desempenho Semanal Médio')).toBeInTheDocument();
    expect(screen.getByText('Status Geral')).toBeInTheDocument();

    const alertsCard = screen.getByText('Alertas Ativos').closest('.MuiCardContent-root');
    expect(alertsCard).toBeInTheDocument();

    if (alertsCard?.parentElement) {
      fireEvent.click(alertsCard.parentElement);
    }

    await waitFor(() => {
      expect(screen.getByText(/Pessoas em alerta/i)).toBeInTheDocument();
      expect(screen.getByText(/emp_alert/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Saúde Mental por Setor/i)).toBeInTheDocument();
  });
});
