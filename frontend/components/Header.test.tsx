import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/Header';
import apiMock from '../services/api';

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/home' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('Header Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockLocation.pathname = '/home';
  });

  const renderHeader = () =>
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

  test('should load and render user profile data', async () => {
    (apiMock.get as any).mockResolvedValue({
      data: {
        first_name: 'John',
        last_name: 'Doe',
        role: 'employee',
        avatar: '',
      },
    });

    renderHeader();

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith('/users/me/');
    });

    const avatarBtn = screen.getByRole('button', { name: /jd/i });
    expect(avatarBtn).toBeInTheDocument();
  });

  test('should navigate to user dashboard on logo click from settings', async () => {
    mockLocation.pathname = '/settings';
    localStorage.setItem('user_role', 'psychologist');

    (apiMock.get as any).mockResolvedValue({
      data: { role: 'psychologist' },
    });

    renderHeader();

    const logo = screen.getByText('Burnoutzero');
    fireEvent.click(logo);

    expect(mockNavigate).toHaveBeenCalledWith('/psychologist');
  });

  test('should handle logout flow correctly', async () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('refresh_token', 'refresh');

    (apiMock.get as any).mockResolvedValue({
      data: { first_name: 'John', role: 'employee' },
    });

    renderHeader();

    const avatarBtn = await screen.findByRole('button', { name: /j/i });
    fireEvent.click(avatarBtn);

    const logoutBtn = screen.getByText('Sair');
    fireEvent.click(logoutBtn);

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('should listen to user-profile-updated custom events', async () => {
    (apiMock.get as any).mockResolvedValue({
      data: { first_name: 'John', role: 'employee' },
    });

    renderHeader();

    fireEvent(
      window,
      new CustomEvent('user-profile-updated', {
        detail: { name: 'New Name', avatar: 'new-avatar.png' },
      })
    );

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalled();
    });
  });

  test('should fallback to defaults if profile load fails', async () => {
    (apiMock.get as any).mockRejectedValue(new Error('API error'));

    renderHeader();

    await waitFor(() => {
      expect(apiMock.get).toHaveBeenCalledWith('/users/me/');
    });

    expect(screen.queryByRole('button', { name: /sair/i })).not.toBeInTheDocument();
  });
});
