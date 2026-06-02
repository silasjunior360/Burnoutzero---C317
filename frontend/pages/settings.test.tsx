import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Settings from '../pages/settings';
import { useUser } from '../user-context';
import { useThemeMode } from '../theme-context';
import apiMock from '../services/api';

vi.mock('../user-context', () => ({
  useUser: vi.fn(),
}));

vi.mock('../theme-context', () => ({
  useThemeMode: vi.fn(),
}));

vi.mock('../services/api', () => ({
  default: {
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Settings Page', () => {
  const mockToggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useThemeMode as any).mockReturnValue({
      mode: 'light',
      toggleTheme: mockToggleTheme,
    });
  });

  test('should redirect to login if user is not authenticated', () => {
    (useUser as any).mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('should render profile fields with user values', () => {
    (useUser as any).mockReturnValue({
      user: {
        username: 'john_doe',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        avatar: '',
        role: 'employee',
      },
      loading: false,
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Nome de usuário/i)).toHaveValue('john_doe');
    expect(screen.getByLabelText(/^Nome$/i)).toHaveValue('John');
    expect(screen.getByLabelText(/Sobrenome/i)).toHaveValue('Doe');
    expect(screen.getByLabelText(/E-mail/i)).toHaveValue('john@example.com');
  });

  test('should toggle theme mode on switch click', () => {
    (useUser as any).mockReturnValue({
      user: { username: 'john_doe', role: 'employee' },
      loading: false,
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const themeSwitch = screen.getByRole('switch', { name: /Claro/i });
    fireEvent.click(themeSwitch);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  test('should submit profile edits successfully', async () => {
    (useUser as any).mockReturnValue({
      user: { username: 'john_doe', role: 'employee' },
      loading: false,
    });
    (apiMock.patch as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const firstNameInput = screen.getByLabelText(/^Nome$/i);
    fireEvent.change(firstNameInput, { target: { value: 'Johnny' } });

    const submitBtn = screen.getByRole('button', { name: /Salvar perfil/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiMock.patch).toHaveBeenCalledWith('/users/me/', {
        username: 'john_doe',
        first_name: 'Johnny',
        last_name: '',
        email: '',
        avatar: '',
      });
      expect(screen.getByText('Perfil atualizado com sucesso.')).toBeInTheDocument();
    });
  });

  test('should validate and change password successfully', async () => {
    (useUser as any).mockReturnValue({
      user: { username: 'john_doe', role: 'employee' },
      loading: false,
    });
    (apiMock.post as any).mockResolvedValue({});

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const currentPwdInput = screen.getByLabelText("Senha atual *");
    const newPwdInput = screen.getByLabelText("Nova senha *");
    const confirmPwdInput = screen.getByLabelText("Confirmar nova senha *");

    fireEvent.change(currentPwdInput, { target: { value: 'oldpass123' } });
    fireEvent.change(newPwdInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPwdInput, { target: { value: 'newpassword123' } });

    const submitBtn = screen.getByRole('button', { name: /Alterar senha/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith('/users/me/password/', {
        current_password: 'oldpass123',
        new_password: 'newpassword123',
        confirm_password: 'newpassword123',
      });
      expect(screen.getByText('Senha alterada com sucesso.')).toBeInTheDocument();
    });
  });

  test('should display password validation error if passwords do not match', async () => {
    (useUser as any).mockReturnValue({
      user: { username: 'john_doe', role: 'employee' },
      loading: false,
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const currentPwdInput = screen.getByLabelText("Senha atual *");
    const newPwdInput = screen.getByLabelText("Nova senha *");
    const confirmPwdInput = screen.getByLabelText("Confirmar nova senha *");

    fireEvent.change(currentPwdInput, { target: { value: 'oldpass' } });
    fireEvent.change(newPwdInput, { target: { value: 'pass12345' } });
    fireEvent.change(confirmPwdInput, { target: { value: 'differentpass' } });

    const submitBtn = screen.getByRole('button', { name: /Alterar senha/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('A confirmação da nova senha não confere.')).toBeInTheDocument();
  });

  test('should display password validation error if new password is under 8 characters', async () => {
    (useUser as any).mockReturnValue({
      user: { username: 'john_doe', role: 'employee' },
      loading: false,
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const currentPwdInput = screen.getByLabelText("Senha atual *");
    const newPwdInput = screen.getByLabelText("Nova senha *");
    const confirmPwdInput = screen.getByLabelText("Confirmar nova senha *");

    fireEvent.change(currentPwdInput, { target: { value: 'oldpass' } });
    fireEvent.change(newPwdInput, { target: { value: 'short' } });
    fireEvent.change(confirmPwdInput, { target: { value: 'short' } });

    const submitBtn = screen.getByRole('button', { name: /Alterar senha/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('A nova senha precisa ter pelo menos 8 caracteres.')).toBeInTheDocument();
  });

  test('should display password validation error if new password contains only digits', async () => {
    (useUser as any).mockReturnValue({
      user: { username: 'john_doe', role: 'employee' },
      loading: false,
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const currentPwdInput = screen.getByLabelText("Senha atual *");
    const newPwdInput = screen.getByLabelText("Nova senha *");
    const confirmPwdInput = screen.getByLabelText("Confirmar nova senha *");

    fireEvent.change(currentPwdInput, { target: { value: 'oldpass' } });
    fireEvent.change(newPwdInput, { target: { value: '12345678' } });
    fireEvent.change(confirmPwdInput, { target: { value: '12345678' } });

    const submitBtn = screen.getByRole('button', { name: /Alterar senha/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('A nova senha não pode conter apenas números.')).toBeInTheDocument();
  });

  test('should display error message when profile edit api fails', async () => {
    (useUser as any).mockReturnValue({
      user: { username: 'john_doe', role: 'employee' },
      loading: false,
    });
    (apiMock.patch as any).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    const firstNameInput = screen.getByLabelText(/^Nome$/i);
    fireEvent.change(firstNameInput, { target: { value: 'Johnny' } });

    const submitBtn = screen.getByRole('button', { name: /Salvar perfil/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Não foi possível salvar as alterações do perfil.')).toBeInTheDocument();
    });
  });
});
