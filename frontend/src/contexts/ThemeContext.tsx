import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
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
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setMode(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme', newMode);
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#4caf50', // Beautiful green
        light: '#81c784', // Light green
        dark: '#388e3c', // Dark green
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#8bc34a', // Light green accent
        light: '#aed581', // Very light green
        dark: '#689f38', // Dark green accent
        contrastText: '#000000',
      },
      background: {
        default: mode === 'light' ? '#f8faf8' : '#121212', // Very light green tint
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
      text: {
        primary: mode === 'light' ? '#2e3a2e' : '#ffffff', // Dark green tint
        secondary: mode === 'light' ? '#5a6b5a' : '#b0b0b0', // Medium green tint
      },
      success: {
        main: '#66bb6a', // Success green
        light: '#98ee99', // Light success green
        dark: '#388e3c', // Dark success green
      },
      info: {
        main: '#42a5f5', // Info blue
        light: '#80d8ff', // Light info blue
        dark: '#1976d2', // Dark info blue
      },
      warning: {
        main: '#ff9800', // Warning orange
        light: '#ffd54f', // Light warning orange
        dark: '#f57c00', // Dark warning orange
      },
      error: {
        main: '#f44336', // Error red
        light: '#ff7961', // Light error red
        dark: '#d32f2f', // Dark error red
      },
      divider: mode === 'light' ? '#e8f5e8' : '#333333', // Light green divider
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
            },
          },
          contained: {
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'light' 
              ? '0 2px 8px rgba(76, 175, 80, 0.1)' 
              : '0 2px 8px rgba(0, 0, 0, 0.3)',
            '&:hover': {
              boxShadow: mode === 'light' 
                ? '0 8px 24px rgba(76, 175, 80, 0.15)' 
                : '0 8px 24px rgba(0, 0, 0, 0.4)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0 1px 4px rgba(76, 175, 80, 0.1)' 
              : '0 1px 4px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light' 
              ? '0 2px 10px rgba(76, 175, 80, 0.15)' 
              : '0 2px 10px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            boxShadow: mode === 'light' 
              ? '2px 0 10px rgba(76, 175, 80, 0.1)' 
              : '2px 0 10px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#81c784',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#4caf50',
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
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, isDark: mode === 'dark' }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
