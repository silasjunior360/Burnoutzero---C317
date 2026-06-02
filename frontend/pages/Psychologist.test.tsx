import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Psychologist from './Psychologist';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockedGet = api.get as MockedFunction<typeof api.get>;
const mockedPatch = api.patch as MockedFunction<typeof api.patch>;

describe('Psychologist Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render patients list and insight cards and validate insight', async () => {
    mockedGet.mockImplementation((url: string): Promise<unknown> => {
      if (url === '/follow-ups/') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              employee: { username: 'patient_alpha' },
              date: '2026-05-28T12:00:00Z',
              status: 'ativo',
            },
          ],
        });
      }
      if (url === '/insights/') {
        return Promise.resolve({
          data: [
            {
              id: 10,
              text: 'Nível de estresse alto.',
              recommendations: 'Fazer meditação.',
              generated_at: '2026-05-29T10:00:00Z',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    mockedPatch.mockResolvedValueOnce({ data: {} } as never);

    render(
      <MemoryRouter>
        <Psychologist />
      </MemoryRouter>
    );

    // Verify API is called
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/follow-ups/');
      expect(api.get).toHaveBeenCalledWith('/insights/');
    });

    // Check patient name rendered
    expect(screen.getAllByText('patient_alpha')[0]).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();

    // Check insight card rendered
    expect(screen.getByText('Nível de estresse alto.')).toBeInTheDocument();

    // Trigger validation dialog
    const btnValidar = screen.getAllByRole('button', { name: /Validar/i })[0];
    fireEvent.click(btnValidar);

    // Dialog title
    expect(screen.getByText('Validar Insight')).toBeInTheDocument();

    // Modify text in fields
    const inputTexto = screen.getByLabelText(/Texto do Insight/i);
    const inputRecs = screen.getByLabelText(/Recomendações/i);

    fireEvent.change(inputTexto, { target: { value: 'Novo estresse texto.' } });
    fireEvent.change(inputRecs, { target: { value: 'Nova meditação.' } });

    // Submit validation
    const btnSalvar = screen.getByRole('button', { name: /Salvar e Validar/i });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(mockedPatch).toHaveBeenCalledWith('/insights/10/validate/', {
        text: 'Novo estresse texto.',
        recommendations: 'Nova meditação.',
      });
      // The modal should close
      expect(screen.queryByText('Validar Insight')).not.toBeInTheDocument();
    });
  });
});
