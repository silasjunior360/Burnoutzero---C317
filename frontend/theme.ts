// frontend/theme.ts
import { createTheme, type PaletteMode } from '@mui/material/styles';

export type AppThemeMode = PaletteMode;

const baseColors = {
  primary: {
    main: '#147DAC',
    light: '#49A6CF',
    dark: '#0E5F83',
  },
  secondary: {
    main: '#AE45AF',
    light: '#C571BB',
    dark: '#8D368E',
  },
  accent: {
    warning: '#FFB347',
    error: '#FF6B6B',
    success: '#4CAF50',
    info: '#147DAC',
  },
};

const lightTokens = {
  background: {
    default: '#f7f7f7',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#2D3A4A',
    secondary: '#5F6B7A',
  },
  divider: '#DBB0E3',
  actionHover: '#E9BCD5',
};

const darkTokens = {
  background: {
    default: '#101418',
    paper: '#171C24',
  },
  text: {
    primary: '#E6EDF3',
    secondary: '#A8B3C2',
  },
  divider: '#2D3746',
  actionHover: 'rgba(174, 69, 175, 0.18)',
};

export const createAppTheme = (mode: PaletteMode) => {
  const tokens = mode === 'dark' ? darkTokens : lightTokens;

  return createTheme({
    palette: {
      mode,
      primary: baseColors.primary,
      secondary: baseColors.secondary,
      error: { main: baseColors.accent.error },
      warning: { main: baseColors.accent.warning },
      success: { main: baseColors.accent.success },
      info: { main: baseColors.accent.info },
      background: tokens.background,
      text: tokens.text,
      divider: tokens.divider,
      action: {
        hover: tokens.actionHover,
      },
    },

    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontSize: '2.5rem', fontWeight: 600 },
      h2: { fontSize: '2rem', fontWeight: 600 },
      h3: { fontSize: '1.75rem', fontWeight: 600 },
      h4: { fontSize: '1.5rem', fontWeight: 500 },
      h5: { fontSize: '1.25rem', fontWeight: 500 },
      h6: { fontSize: '1.125rem', fontWeight: 500 },
    },

    shape: {
      borderRadius: 12,
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.background.default,
            color: tokens.text.primary,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow:
              mode === 'dark'
                ? '0px 8px 24px rgba(0, 0, 0, 0.28)'
                : '0px 4px 12px rgba(0, 0, 0, 0.05)',
            borderRadius: 16,
          },
        },
      },
    },
  });
};

export const theme = createAppTheme('light');