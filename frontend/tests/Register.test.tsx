import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register';
import api from '../services/api';

const mockedUsedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedUsedNavigate,
  };
});

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockedPost = api.post as MockedFunction<typeof api.post>;

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn();
  });

  it('should render step 1 (Dados pessoais) fields', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Usuário/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Senha/i)[0]).toBeInTheDocument();
  });

  it('should show error validation in step 1 if fields are empty', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const nextBtn = screen.getByRole('button', { name: /Próximo/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Nome é obrigatório/i)).toBeInTheDocument();
  });

  it('should go through steps and register successfully', async () => {
    mockedPost.mockResolvedValueOnce({ data: {} } as never);

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Nome completo/i), { target: { value: 'Silas Junior' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'silas@email.com' } });
    fireEvent.change(screen.getByLabelText(/Usuário/i), { target: { value: 'silas123' } });

    const passwordFields = screen.getAllByLabelText(/Senha/i);
    fireEvent.change(passwordFields[0], { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Confirmar senha/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    expect(await screen.findByText(/Qual seu perfil\?/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    expect(await screen.findByText(/Termos de Consentimento LGPD/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Finalizar Cadastro/i }));
    expect(screen.getByText(/Você precisa aceitar os termos LGPD/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Li e concordo com os termos de uso/i));
    fireEvent.click(screen.getByRole('button', { name: /Finalizar Cadastro/i }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/auth/register/', {
        username: 'silas123',
        email: 'silas@email.com',
        password: 'password123',
        first_name: 'Silas',
        last_name: 'Junior',
        role: 'funcionario',
        company_code: '',
        department: '',
      });
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
