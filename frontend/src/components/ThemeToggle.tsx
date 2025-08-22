import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <IconButton
        onClick={toggleTheme}
        sx={{
          color: 'inherit',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        aria-label="toggle theme"
      >
        {isDark ? (
          <LightModeIcon sx={{ color: '#ffd700' }} />
        ) : (
          <DarkModeIcon sx={{ color: '#6b46c1' }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
