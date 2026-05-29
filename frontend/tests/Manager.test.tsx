import { render, screen, waitFor } from '@testing-library/react';
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
    mockedGet.mockResolvedValueOnce({
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
    } as never);

    render(
      <MemoryRouter>
        <Manager />
      </MemoryRouter>
    );

    expect(api.get).toHaveBeenCalledWith('/manager/team-overview/');

    // Assert alerts display
    await waitFor(() => {
      expect(screen.getByText(/emp_alert/i)).toBeInTheDocument();
      expect(screen.getByText(/Avaliação de alto risco identificada/i)).toBeInTheDocument();
    });

    // Assert averages display
    expect(screen.getByText('42.5')).toBeInTheDocument(); // Estresse médio
    expect(screen.getByText('30.2')).toBeInTheDocument(); // Burnout médio
    
    // Assert active alerts count inside its specific card
    const alertsCard = screen.getByText('Alertas ativos').closest('.MuiCardContent-root');
    expect(alertsCard).toHaveTextContent('1');

    // Assert section table headers/values
    expect(screen.getByText(/Saúde Mental por Setor/i)).toBeInTheDocument();
    expect(screen.getByText('TI')).toBeInTheDocument();
    expect(screen.getByText('RH')).toBeInTheDocument();
  });
});
