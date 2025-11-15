import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  responsiveFontSizes,
} from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setMode(savedTheme);
    } else {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme', newMode);
  };

  // Professional KIIT green palette (harmonized, accessible)
  // Usage guidance:
  // - primary: main brand color for CTAs and key interactive elements
  // - secondary: supportive accent for badges and highlights
  // - accent: subtle teal for info and links
  // - neutrals: background and text surfaces
  const colors = {
    primary: {
      main: '#0B6B3A', // deep KIIT green (accessible, professional)
      light: '#2E8B57',
      dark: '#054A2F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#107E4B',
      light: '#36A06A',
      dark: '#0C5B33',
      contrastText: '#FFFFFF',
    },
    accent: {
      main: '#0284C7', // softer teal accent
      light: '#38BDF8',
      dark: '#0369A1',
    },
    sky: {
      50: '#F0F9FF',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9',
      600: '#0284C7',
      700: '#0369A1',
      800: '#075985',
      900: '#0C4A6E',
    },
    green: {
      50: '#F3FBF6',
      100: '#E6F7EE',
      200: '#CFF0DE',
      300: '#9FE6C0',
      400: '#66D49A',
      500: '#36A06A',
      600: '#0B6B3A',
      700: '#07572F',
      800: '#054A2F',
      900: '#033826',
    },

    neutral: {
      50: '#FBFBFD',
      100: '#F5F7FA',
      200: '#E9EEF5',
      300: '#D6DEE9',
      400: '#AAB6C4',
      500: '#6D7B87',
      600: '#4B5862',
      700: '#2F3B40',
      800: '#162022',
      900: '#0B1212',
    },

    success: {
      main: '#2E8B57',
      light: '#66D49A',
      dark: '#0B6B3A',
    },
    warning: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
    },
    error: {
      main: '#DC2626',
      light: '#F87171',
      dark: '#991B1B',
    },
    info: {
      main: '#0284C7',
      light: '#38BDF8',
      dark: '#0369A1',
    },
  };

  let theme = createTheme({
    palette: {
      mode,
      // Keep the light palette exactly as before. For dark mode we pick
      // slightly lighter/warmer greens for `primary` so contrast on dark
      // surfaces is better while preserving the brand color family.
      primary:
        mode === 'light'
          ? {
              main: colors.primary.main,
              light: colors.primary.light,
              dark: colors.primary.dark,
              contrastText: colors.primary.contrastText,
            }
          : {
              // For dark mode prefer a more neutral/teal accent rather than
              // saturated greens so the dashboard doesn't feel overwhelmingly
              // green. Keep contrast high enough for accessibility.
              main: colors.accent.main, // softer teal
              light: colors.accent.light,
              dark: colors.accent.dark,
              contrastText: '#FFFFFF',
            },
      secondary: {
        main: colors.secondary.main,
        light: colors.secondary.light,
        dark: colors.secondary.dark,
        contrastText: colors.secondary.contrastText,
      },
      background: {
        default: mode === 'light' ? '#ffffffff' : '#1f1f20ff', //colors.green[50], //colors.neutral[900],
        paper: mode === 'light' ? '#FFFFFF' : '#202022ff', //colors.neutral[800],
      },
      text: {
        primary: mode === 'light' ? colors.neutral[900] : colors.neutral[50],
        secondary: mode === 'light' ? colors.neutral[600] : colors.neutral[400],
      },
      success: colors.success,
      info: colors.info,
      warning: colors.warning,
      error: colors.error,
      divider: mode === 'light' ? colors.green[200] : colors.neutral[700],
      grey: colors.neutral,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.02em',
        // In dark mode use a neutral/teal tone instead of bright green
        color: mode === 'light' ? colors.primary.dark : '#ffffff', //colors.neutral[50],
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: mode === 'light' ? colors.primary.dark : '#ffffff', //colors.neutral[50],
      },
      h3: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: mode === 'light' ? colors.primary.main : '#ffffff', //colors.neutral[50],
      },
      h4: {
        fontWeight: 600,
        color: mode === 'light' ? colors.primary.main : '#ffffff', //colors.neutral[200],
      },
      h5: {
        fontWeight: 600,
        color: mode === 'light' ? colors.primary.main : '#ffffff', //colors.neutral[200],
      },
      h6: {
        fontWeight: 600,
        color: mode === 'light' ? colors.primary.main : '#ffffff', //colors.neutral[300],
      },
      subtitle1: {
        color: mode === 'light' ? colors.neutral[600] : colors.neutral[300],
      },
      subtitle2: {
        color: mode === 'light' ? colors.neutral[500] : colors.neutral[400],
      },
      body1: {
        color: mode === 'light' ? colors.neutral[700] : colors.neutral[200],
      },
      body2: {
        color: mode === 'light' ? colors.neutral[600] : colors.neutral[300],
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.01em',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            padding: '12px 24px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              transition: 'left 0.5s',
            },
            '&:hover': {
              boxShadow: `0 8px 30px rgba(11,107,58,0.15)`,
              transform: 'translateY(-2px)',
              '&::before': {
                left: '100%',
              },
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          contained: {
            // In dark mode prefer a neutral/teal gradient instead of full
            // green to avoid visual dominance. Use primary for light mode
            // (unchanged) and a toned-down variant for dark mode via
            // functions below when consumed by components.
            background:
              mode === 'light'
                ? `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`
                : `linear-gradient(135deg, ${colors.accent.main} 0%, ${colors.info.main} 100%)`,
          },
          text: {
            color: mode === 'light' ? colors.primary.main : colors.neutral[50],
            '&:hover': {
              backgroundColor:
                mode === 'light'
                  ? `${colors.primary.main}06`
                  : `${colors.primary.main}14`,
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            // boxShadow:
            //   mode === 'light'
            //     ? '0 4px 20px rgba(255, 255, 255, 0.08)'
            //     : '0 4px 20px rgba(0, 0, 0, 0.3)',
            // border:
            //   // mode === 'light'
            //      `1px solid ${colors.green[200]}`,
            //     // : `1px solid ${colors.neutral[700]}`,
            background: mode === 'light' ? '#fbfbfbfb' : '#202022ff', //colors.neutral[800],
            // transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            // '&::before': {
            //   content: '""',
            //   position: 'absolute',
            //   top: 0,
            //   left: 0,
            //   right: 0,
            //   height: '4px',
            //   background: `linear-gradient(90deg, ${colors.primary.main}, ${colors.secondary.main})`,
            //   transform: 'scaleX(0)',
            //   transformOrigin: 'left',
            //   transition: 'transform 0.3s ease',
            // },
            // '&:hover': {
            //   boxShadow:
            //     mode === 'light'
            //       ? '0 12px 40px rgba(5, 150, 105, 0.15)'
            //       : '0 12px 40px rgba(0, 0, 0, 0.4)',
            //   // transform: 'translateY(-8px)',
            // },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow:
              mode === 'light'
                ? '0 2px 12px rgba(5, 150, 105, 0.06)'
                : '0 2px 12px rgba(0, 0, 0, 0.3)',
            background: mode === 'light' ? '#FFFFFF' : '#202022ff', //colors.neutral[800],
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background:
              mode === 'light'
                ? `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.accent.main} 100%)`
                : `linear-gradient(135deg, ${colors.neutral[800]} 0%, ${colors.primary.dark} 100%)`,
            boxShadow:
              mode === 'light'
                ? '0 4px 20px rgba(5, 150, 105, 0.15)'
                : '0 4px 20px rgba(0, 0, 0, 0.4)',
            border: 'none',
            backdropFilter: 'blur(20px)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            boxShadow:
              mode === 'light'
                ? '4px 0 20px rgba(5, 150, 105, 0.1)'
                : '4px 0 20px rgba(0, 0, 0, 0.4)',
            border: 'none',
            background:
              mode === 'light'
                ? `${colors.green[50]}EE`
                : `${colors.neutral[900]}EE`,
            backdropFilter: 'blur(20px)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.3s ease-in-out',
              '&:hover fieldset': {
                borderColor: colors.primary.light,
                boxShadow: `0 0 0 2px ${colors.primary.light}20`,
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.primary.main,
                boxShadow: `0 0 0 3px ${colors.primary.main}20`,
              },
            },
            '& .MuiInputLabel-root': {
              color:
                mode === 'light' ? colors.neutral[600] : colors.neutral[400],
              '&.Mui-focused': {
                color: colors.primary.main,
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '&.MuiChip-filledPrimary': {
              background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.light} 100%)`,
            },
            '&.MuiChip-filledSecondary': {
              background: `linear-gradient(135deg, ${colors.secondary.main} 0%, ${colors.secondary.light} 100%)`,
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            color: colors.neutral[400],
            '&.Mui-checked': {
              color: colors.primary.main,
            },
          },
          track: {
            backgroundColor:
              mode === 'light' ? colors.neutral[300] : colors.neutral[600],
            '&.Mui-checked': {
              backgroundColor: `${colors.primary.main}80`,
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor:
              mode === 'light' ? colors.green[200] : colors.neutral[700],
          },
        },
      },
    },
  });

  theme = responsiveFontSizes(theme, { factor: 1.2 });

  return (
    <ThemeContext.Provider
      value={{ mode, toggleTheme, isDark: mode === 'dark' }}
    >
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
