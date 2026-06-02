import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import { UserProvider, useUser } from './user-context';
import api from './services/api';

vi.mock('./services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedGet = api.get as MockedFunction<typeof api.get>;

const TestComponent = () => {
  const { user, loading, refreshUser, updateUser, logout } = useUser();
  if (loading) return <div>Loading...</div>;
  return (
    <div>
      <span data-testid="username">{user?.username || 'No User'}</span>
      <span data-testid="role">{user?.role || 'No Role'}</span>
      <span data-testid="points">{user?.total_pontos ?? 'No Points'}</span>
      <button onClick={refreshUser}>Refresh</button>
      <button onClick={() => updateUser({ username: 'updated_user', role: 'manager' })}>Update</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('UserContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('should render children with null user initially when no token is present', async () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('username').textContent).toBe('No User');
  });

  test('should fetch and load user details on mount if access_token is present', async () => {
    localStorage.setItem('access_token', 'fake-token');
    mockedGet.mockImplementation((url: string): Promise<unknown> => {
      if (url === '/users/me/') {
        return Promise.resolve({
          data: {
            username: 'joe_cool',
            user_type: 'psychologist',
            first_name: 'Joe',
          },
        });
      }
      if (url === '/gamification/my-points/') {
        return Promise.resolve({
          data: {
            total_pontos: 350,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('username').textContent).toBe('joe_cool');
    });

    expect(screen.getByTestId('role').textContent).toBe('psychologist');
    expect(screen.getByTestId('points').textContent).toBe('350');
  });

  test('should support updating user info and syncing to localStorage', async () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const updateBtn = screen.getByText('Update');
    fireEvent.click(updateBtn);

    expect(screen.getByTestId('username').textContent).toBe('updated_user');
    expect(screen.getByTestId('role').textContent).toBe('manager');

    const storedUser = JSON.parse(localStorage.getItem('burnout-zero-user') || '{}');
    expect(storedUser.username).toBe('updated_user');
  });

  test('should clear local tokens and context state on logout', async () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('refresh_token', 'refresh-token');
    localStorage.setItem('user_role', 'employee');
    localStorage.setItem('burnout-zero-user', JSON.stringify({ username: 'john' }));

    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);

    expect(screen.getByTestId('username').textContent).toBe('No User');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('user_role')).toBeNull();
    expect(localStorage.getItem('burnout-zero-user')).toBeNull();
  });
});
