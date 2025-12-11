import { FC } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: FC = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
        <IconButton
          onClick={toggleTheme}
          sx={{
            color: 'inherit',
            '&:hover': {
              backgroundColor: 'rgba(34, 197, 94, 0.12)', // green tint on hover
            },
          }}
          aria-label="toggle theme"
        >
          <motion.div
            key={isDark ? 'sun' : 'moon'}
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            {isDark ? (
              <LightModeIcon sx={{ color: '#facc15' }} />
            ) : (
              <DarkModeIcon sx={{ color: '#22c55e' }} />
            )}
          </motion.div>
        </IconButton>
      </Tooltip>
    </motion.div>
  );
};

export default ThemeToggle;
