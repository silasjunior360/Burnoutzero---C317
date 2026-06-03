import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Employee from './Employee';
import api from '../services/api';

// Mock do axios (api)
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const mockedPost = api.post as MockedFunction<typeof api.post>;
const mockedGet = api.get as MockedFunction<typeof api.get>;

// Mock do ResizeObserver que o Recharts usa
window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
})) as unknown as typeof ResizeObserver;

// Mock do ResponsiveContainer para evitar erros de renderização em testes
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div style={{ width: '100%', height: '100%' }}>{children}</div>,
  };
});

vi.mock('../user-context', () => ({
  useUser: () => ({
    user: {
      id: 1,
      username: 'test_user',
      first_name: 'Test',
      last_name: 'User',
      role: 'employee',
      avatar: 'TU',
      total_pontos: 100,
    },
  }),
}));

describe('Employee Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Respostas padrão para os mocks
    mockedGet.mockImplementation((url: string): Promise<unknown> => {
        if (url === '/assessments/') return Promise.resolve({ data: [] });
        if (url === '/insights/') return Promise.resolve({ data: [] });
        if (url === '/gamification/my-points/') return Promise.resolve({ data: { total_pontos: 100 } });
        if (url === '/appointments/') return Promise.resolve({ data: [] });
        return Promise.resolve({ data: {} });
    });
  });

  it('should render metrics and initial data', async () => {
    render(
      <MemoryRouter>
        <Employee />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/100 pontos/i)).toBeInTheDocument();
      // Usamos getAllByText e pegamos o primeiro (o card de métrica)
      expect(screen.getAllByText(/Estresse/i)[0]).toBeInTheDocument();
    });
  });

  it('should open and submit new assessment', async () => {
    mockedPost.mockResolvedValueOnce({ data: {} } as never);

    render(
      <MemoryRouter>
        <Employee />
      </MemoryRouter>
    );

    const btnNovaAvaliacao = screen.getByRole('button', { name: /Nova Avaliação/i });
    fireEvent.click(btnNovaAvaliacao);

    // Verifica se o dialog abriu
    expect(screen.getByText(/Como você está se sentindo\?/i)).toBeInTheDocument();

    // Preenche campos - usamos label text mas garantimos que pegamos o do dialog
    const inputs = screen.getAllByLabelText(/Estresse/i);
    fireEvent.change(inputs[inputs.length - 1], { target: { value: '45' } });
    
    const btnEnviar = screen.getByRole('button', { name: 'Enviar Avaliação' });
    fireEvent.click(btnEnviar);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/assessments/', expect.objectContaining({
        stress: 45
      }));
      expect(screen.getByText(/Avaliação enviada com sucesso!/i)).toBeInTheDocument();
    });
  });

  it('should open appointment dialog', async () => {
    render(
      <MemoryRouter>
        <Employee />
      </MemoryRouter>
    );

    await waitFor(() => {
        const btnAgendar = screen.getAllByRole('button', { name: /14:00/i })[0];
        fireEvent.click(btnAgendar);
    });

    // "Confirmar Agendamento" aparece no título e no botão, então pegamos o título
    expect(screen.getByRole('heading', { name: /Confirmar Agendamento/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Dra. Ana Silva/i)[0]).toBeInTheDocument();
  });
});
