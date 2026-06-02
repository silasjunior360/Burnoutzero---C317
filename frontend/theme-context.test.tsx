import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, describe, beforeEach } from 'vitest';
import { ThemeModeProvider, useThemeMode } from './theme-context';

const TestComponent = () => {
  const { mode, toggleTheme, setMode } = useThemeMode();
  return (
    <div>
      <span data-testid="theme-mode">{mode}</span>
      <button onClick={toggleTheme}>Toggle</button>
      <button onClick={() => setMode('dark')}>SetDark</button>
      <button onClick={() => setMode('light')}>SetLight</button>
    </div>
  );
};

describe('ThemeModeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should render children with default light theme mode and persist in localStorage', () => {
    render(
      <ThemeModeProvider>
        <TestComponent />
      </ThemeModeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    expect(localStorage.getItem('burnoutzero-theme-mode')).toBe('light');
  });

  test('should load theme mode from localStorage on mount', () => {
    localStorage.setItem('burnoutzero-theme-mode', 'dark');

    render(
      <ThemeModeProvider>
        <TestComponent />
      </ThemeModeProvider>
    );

    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
  });

  test('should toggle theme mode and update localStorage', () => {
    render(
      <ThemeModeProvider>
        <TestComponent />
      </ThemeModeProvider>
    );

    const toggleBtn = screen.getByText('Toggle');
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');

    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(localStorage.getItem('burnoutzero-theme-mode')).toBe('dark');

    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    expect(localStorage.getItem('burnoutzero-theme-mode')).toBe('light');
  });

  test('should set theme mode explicitly using setMode', () => {
    render(
      <ThemeModeProvider>
        <TestComponent />
      </ThemeModeProvider>
    );

    const setDarkBtn = screen.getByText('SetDark');
    const setLightBtn = screen.getByText('SetLight');

    fireEvent.click(setDarkBtn);
    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(localStorage.getItem('burnoutzero-theme-mode')).toBe('dark');

    fireEvent.click(setLightBtn);
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    expect(localStorage.getItem('burnoutzero-theme-mode')).toBe('light');
  });
});
