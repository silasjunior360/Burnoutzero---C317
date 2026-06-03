import { render, screen, fireEvent, act } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../services/api';

const mockedApi = vi.mocked(api, { deep: true });

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

    mockedApi.get.mockImplementation((url: string) => {
      if (url === '/users/me/') {
        return Promise.resolve({
          data: {
            first_name: 'Ana',
            last_name: 'Silva',
            username: 'ana',
            role: 'employee',
          },
        });
      }

      if (url === '/gamification/me/') {
        return Promise.resolve({
          data: {
            profile: {
              nome: 'Ana Silva',
              avatar: 'AS',
              xp: 0,
              xpProximo: 1500,
              pontos: 0,
              diasAtivo: 0,
              level: 1,
            },
            storage: {
              'burnout-zero-daily-words': {
                collectedWords: [],
                currentWord: null,
                nextWordAt: 0,
                completed: false,
                xpAwarded: false,
              },
              'burnout-zero-mood-challenge': {
                selectedMood: null,
                claimedDate: null,
                history: [],
              },
              'burnout-zero-streak': {
                streakDays: 0,
                lastClaimDate: null,
                claimedDate: null,
              },
              'burnout-zero-water-weekly': {
                totalMl: 0,
                lastSipTime: null,
                waterXp: 0,
                history: {},
              },
              'burnout-zero-breaths': {
                cyclesCompleted: 0,
                cycles: 0,
                totalTime: 0,
                phaseTime: 0,
                currentPhase: 'inhale',
                xpAwarded: false,
              },
              'burnout-zero-pontos': 0,
            },
            reward_tiers: {
              consistency: -1,
              hydration: -1,
              breathing: -1,
            },
            earned_achievements: [],
            points_history: [],
          },
        });
      }

      return Promise.resolve({ data: {} });
    });

    mockedApi.post.mockResolvedValue({ data: {} });
    mockedApi.patch.mockResolvedValue({ data: {} });
  });

  const renderHome = () =>
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

  test('should render welcome message and main sections', () => {
    renderHome();
    expect(screen.getByText(/SUA JORNADA DE BEM-ESTAR/i)).toBeInTheDocument();
    expect(screen.getByText(/Desafios Diários/i)).toBeInTheDocument();
  });

  describe('Water Challenge', () => {
    test('should increment water consumption when clicking drink button', () => {
      renderHome();
      
      const drinkButton = screen.getByRole('button', { name: /Beber 200ml/i });
      
      expect(screen.getByText(/0L \/ 3L/i)).toBeInTheDocument();
      fireEvent.click(drinkButton);
      expect(screen.getByText(/0.2L \/ 3L/i)).toBeInTheDocument();
    });

    test('should show cooldown message after drinking', () => {
      renderHome();
      const drinkButton = screen.getByRole('button', { name: /Beber 200ml/i });
      
      fireEvent.click(drinkButton);
      
      expect(screen.getByText(/Próximo gole em/i)).toBeInTheDocument();
      expect(drinkButton).toBeDisabled();
    });
  });

  describe('Breathing Exercise', () => {
    test('should start breathing exercise when clicking iniciar', () => {
      renderHome();
      
      const startButton = screen.getByRole('button', { name: 'Iniciar' });
      fireEvent.click(startButton);
      
      expect(screen.getByText(/Inspire contando até 4/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Pausar/i })).toBeInTheDocument();
    });

    test('should cycle through breathing phases', () => {
      renderHome();
      
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
