import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createAppTheme, type AppThemeMode } from './theme';

/* eslint-disable react-refresh/only-export-components */

type ThemeContextValue = {
  mode: AppThemeMode;
  toggleTheme: () => void;
  setMode: (mode: AppThemeMode) => void;
};

const THEME_STORAGE_KEY = 'burnoutzero-theme-mode';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<AppThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    return storedMode === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      toggleTheme: () => setModeState((current) => (current === 'light' ? 'dark' : 'light')),
      setMode: setModeState,
    }),
    [mode]
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeMode = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  }

  return context;
};