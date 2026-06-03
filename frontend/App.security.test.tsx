import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

vi.mock('./services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    }
  },
}));

window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div style={{ width: '100%', height: '100%' }}>{children}</div>,
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
  };
});

describe('Security Leak - Final Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    window.history.pushState({}, 'Test', '/employee');
  });

  it('should NOT render employee page and redirect to login when no token is present', async () => {
    render(
      <MemoryRouter initialEntries={['/employee']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Olá, João!/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Faça login para acessar sua área/i)).toBeInTheDocument();
    });
  });
});
