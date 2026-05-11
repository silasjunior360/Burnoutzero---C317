import { render, screen, fireEvent, act } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import Home from '../pages/Home';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Home (Jornada) Interactive Components', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  test('should render welcome message and main sections', () => {
    render(<Home />);
    expect(screen.getByText(/SUA JORNADA DE BEM-ESTAR/i)).toBeInTheDocument();
    expect(screen.getByText(/Desafios Diários/i)).toBeInTheDocument();
  });

  describe('Water Challenge', () => {
    test('should increment water consumption when clicking drink button', () => {
      render(<Home />);
      
      const drinkButton = screen.getByRole('button', { name: /Beber 200ml/i });
      
      expect(screen.getByText(/0L \/ 3L/i)).toBeInTheDocument();
      fireEvent.click(drinkButton);
      expect(screen.getByText(/0.2L \/ 3L/i)).toBeInTheDocument();
    });

    test('should show cooldown message after drinking', () => {
      render(<Home />);
      const drinkButton = screen.getByRole('button', { name: /Beber 200ml/i });
      
      fireEvent.click(drinkButton);
      
      expect(screen.getByText(/Próximo gole em/i)).toBeInTheDocument();
      expect(drinkButton).toBeDisabled();
    });
  });

  describe('Breathing Exercise', () => {
    test('should start breathing exercise when clicking iniciar', () => {
      render(<Home />);
      
      const startButton = screen.getByRole('button', { name: 'Iniciar' });
      fireEvent.click(startButton);
      
      expect(screen.getByText(/Inspire contando até 4/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Pausar/i })).toBeInTheDocument();
    });

    test('should cycle through breathing phases', () => {
      render(<Home />);
      
      const startButton = screen.getByRole('button', { name: 'Iniciar' });
      fireEvent.click(startButton);
      
      expect(screen.getByText(/Inspire contando até 4/i)).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(screen.getByText(/Segure a respiração por 3 segundos/i)).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText(/Expire lentamente em 3 segundos/i)).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText(/Inspire contando até 4/i)).toBeInTheDocument();
    });
  });
});
