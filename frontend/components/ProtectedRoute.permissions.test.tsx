import { render, screen } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const MockLogin = () => <div>Login Page</div>;
const MockFuncionario = () => <div>Funcionario Dashboard</div>;
const MockPsicologo = () => <div>Psicologo Dashboard</div>;
const MockGestor = () => <div>Gestor Dashboard</div>;

import ProtectedRoute from '../components/ProtectedRoute';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Page Permission Access', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialEntries: string[]) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<MockLogin />} />
          
          <Route element={<ProtectedRoute allowedRoles={['funcionario', 'psicologo', 'gestor']} />}>
            <Route path="/funcionario" element={<MockFuncionario />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['psicologo']} />}>
            <Route path="/psicologo" element={<MockPsicologo />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['gestor']} />}>
            <Route path="/gestor" element={<MockGestor />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
  };

  test('should redirect to login if not authenticated', () => {
    renderWithRouter(['/funcionario']);
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
  });

  test('should allow access to funcionario if user has funcionario role', () => {
    localStorage.setItem('access_token', 'valid-token');
    localStorage.setItem('user_role', 'funcionario');
    
    renderWithRouter(['/funcionario']);
    expect(screen.getByText(/Funcionario Dashboard/i)).toBeInTheDocument();
  });

  test('should deny access to psicologo if user is a funcionario', () => {
    localStorage.setItem('access_token', 'valid-token');
    localStorage.setItem('user_role', 'funcionario');
    
    renderWithRouter(['/psicologo']);
    expect(screen.queryByText(/Psicologo Dashboard/i)).not.toBeInTheDocument();
  });

  test('should allow access to psicologo if user has psicologo role', () => {
    localStorage.setItem('access_token', 'valid-token');
    localStorage.setItem('user_role', 'psicologo');
    
    renderWithRouter(['/psicologo']);
    expect(screen.getByText(/Psicologo Dashboard/i)).toBeInTheDocument();
  });

  test('should allow access to gestor if user has gestor role', () => {
    localStorage.setItem('access_token', 'valid-token');
    localStorage.setItem('user_role', 'gestor');
    
    renderWithRouter(['/gestor']);
    expect(screen.getByText(/Gestor Dashboard/i)).toBeInTheDocument();
  });
});
