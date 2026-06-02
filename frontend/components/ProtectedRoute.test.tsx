import { render, screen } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

vi.mock('react-router-dom', () => ({
  Navigate: vi.fn(({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />),
  Outlet: vi.fn(() => <div data-testid="outlet" />),
}));


describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('should redirect to login if there is no token', () => {
    render(<ProtectedRoute />);
    const nav = screen.getByTestId('navigate');
    expect(nav).toBeInTheDocument();
    expect(nav.getAttribute('data-to')).toBe('/login');
  });

  test('should redirect to login if role is not allowed', () => {
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user_role', 'employee');

    render(<ProtectedRoute allowedRoles={['manager']} />);
    const nav = screen.getByTestId('navigate');
    expect(nav).toBeInTheDocument();
    expect(nav.getAttribute('data-to')).toBe('/login');
  });

  test('should render Outlet if authenticated and role matches', () => {
    localStorage.setItem('access_token', 'mock-token');
    localStorage.setItem('user_role', 'manager');

    render(<ProtectedRoute allowedRoles={['manager']} />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  test('should render Outlet if authenticated and no role restrictions', () => {
    localStorage.setItem('access_token', 'mock-token');

    render(<ProtectedRoute />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });
});
