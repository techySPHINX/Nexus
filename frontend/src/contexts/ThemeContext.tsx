import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, PaletteMode } from '@mui/material';
import { CssBaseline } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    try {
      // Load theme preference from localStorage
      const savedTheme = localStorage.getItem('theme') as PaletteMode;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setMode(savedTheme);
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setMode(prefersDark ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      // Fallback to light mode
      setMode('light');
    }
  }, []);

  const toggleTheme = () => {
    try {
      const newMode = mode === 'light' ? 'dark' : 'light';
      setMode(newMode);
      localStorage.setItem('theme', newMode);
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  // Create a comprehensive Material-UI theme with dark mode support
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#1976d2',
        light: mode === 'dark' ? '#e3f2fd' : '#42a5f5',
        dark: mode === 'dark' ? '#42a5f5' : '#1565c0',
        contrastText: mode === 'dark' ? '#000' : '#fff',
      },
      secondary: {
        main: mode === 'dark' ? '#f48fb1' : '#dc004e',
        light: mode === 'dark' ? '#f8bbd9' : '#ff5983',
        dark: mode === 'dark' ? '#c2185b' : '#9a0036',
        contrastText: mode === 'dark' ? '#000' : '#fff',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#fafafa',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#ffffff' : '#212121',
        secondary: mode === 'dark' ? '#b3b3b3' : '#757575',
      },
      divider: mode === 'dark' ? '#333333' : '#e0e0e0',
      action: {
        hover: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        selected: mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#1a1a1a' : '#ffffff',
            color: mode === 'dark' ? '#ffffff' : '#212121',
            borderBottom: `1px solid ${mode === 'dark' ? '#2a2a2a' : '#e0e0e0'}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            borderColor: mode === 'dark' ? '#2a2a2a' : '#e0e0e0',
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'dark' ? '#90caf9' : '#1976d2',
            color: mode === 'dark' ? '#000' : '#fff',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === 'dark' ? '#1a1a1a' : '#ffffff',
            border: `1px solid ${mode === 'dark' ? '#2a2a2a' : '#e0e0e0'}`,
            color: mode === 'dark' ? '#ffffff' : '#212121',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h6: {
        fontWeight: 700,
      },
    },
    shape: {
      borderRadius: 12,
    },
  });

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
    isDark: mode === 'dark',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
