import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
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
    get: vi.fn(),
  },
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('should login successfully and redirect employee', async () => {
    (api.post as any).mockResolvedValueOnce({
      data: { access: 'fake-access-token', refresh: 'fake-refresh-token' }
    });
    (api.get as any).mockResolvedValueOnce({
      data: { role: 'employee' }
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Usuário/i), { target: { value: 'user1' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'pass123' } });
    fireEvent.submit(screen.getByRole('button', { name: /Entrar/i }).closest('form')!);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login/', {
        username: 'user1',
        password: 'pass123'
      });
      expect(localStorage.getItem('access_token')).toBe('fake-access-token');
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/employee');
    }, { timeout: 3000 });
  });

  it('should redirect to psychologist dashboard if role is psychologist', async () => {
    (api.post as any).mockResolvedValueOnce({
      data: { access: 'token', refresh: 'refresh' }
    });
    (api.get as any).mockResolvedValueOnce({
      data: { role: 'psychologist' }
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Usuário/i), { target: { value: 'psico' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByRole('button', { name: /Entrar/i }).closest('form')!);

    await waitFor(() => {
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/psychologist');
    }, { timeout: 3000 });
  });

  it('should show error message on invalid credentials', async () => {
    (api.post as any).mockRejectedValueOnce({
      response: { status: 401 }
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Usuário/i), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: /Entrar/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Usuário ou senha inválidos/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
