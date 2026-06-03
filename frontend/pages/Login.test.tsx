import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
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

const mockedPost = api.post as MockedFunction<typeof api.post>;
const mockedGet = api.get as MockedFunction<typeof api.get>;

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

<<<<<<< HEAD:frontend/tests/Auth.test.tsx
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
=======
    expect(screen.getByLabelText(/Usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha/)).toBeInTheDocument();
>>>>>>> origin/main:frontend/pages/Login.test.tsx
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('should login successfully and redirect employee', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { access: 'fake-access-token', refresh: 'fake-refresh-token' }
    } as never);
    mockedGet.mockResolvedValueOnce({
      data: { role: 'employee' }
    } as never);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

<<<<<<< HEAD:frontend/tests/Auth.test.tsx
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user1' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'pass123' } });
=======
    fireEvent.change(screen.getByLabelText(/Usuário/i), { target: { value: 'user1' } });
    fireEvent.change(screen.getByLabelText(/^Senha/), { target: { value: 'pass123' } });
>>>>>>> origin/main:frontend/pages/Login.test.tsx
    fireEvent.submit(screen.getByRole('button', { name: /Entrar/i }).closest('form')!);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login/', {
        username: 'user1',
        password: 'pass123'
      });
      expect(localStorage.getItem('access_token')).toBe('fake-access-token');
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/home');
    }, { timeout: 3000 });
  });

  it('should redirect to psychologist dashboard if role is psychologist', async () => {
    mockedPost.mockResolvedValueOnce({
      data: { access: 'token', refresh: 'refresh' }
    } as never);
    mockedGet.mockResolvedValueOnce({
      data: { role: 'psychologist' }
    } as never);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

<<<<<<< HEAD:frontend/tests/Auth.test.tsx
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'psico' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'pass' } });
=======
    fireEvent.change(screen.getByLabelText(/Usuário/i), { target: { value: 'psico' } });
    fireEvent.change(screen.getByLabelText(/^Senha/), { target: { value: 'pass' } });
>>>>>>> origin/main:frontend/pages/Login.test.tsx
    fireEvent.submit(screen.getByRole('button', { name: /Entrar/i }).closest('form')!);

    await waitFor(() => {
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/psychologist');
    }, { timeout: 3000 });
  });

  it('should show error message on invalid credentials', async () => {
    mockedPost.mockRejectedValueOnce({
      response: { status: 401 }
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: /Entrar/i }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Email ou senha inválidos/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
