import { FC, useState, MouseEvent } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  useTheme,
} from '@mui/material';
import { ViewHeadline, ViewSidebar, Settings } from '@mui/icons-material';
import { useNavbar } from '../contexts/NavbarContext';

const NavbarToggle: FC = () => {
  const { position, setPosition } = useNavbar();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePositionChange = (newPosition: 'top' | 'left') => {
    setPosition(newPosition);
    handleClose();
  };

  const getPositionIcon = () => {
    return position === 'top' ? <ViewHeadline /> : <ViewSidebar />;
  };

  const getPositionText = () => {
    return position === 'top' ? 'Top Navbar' : 'Left Navbar';
  };

  // Dynamic colors based on theme
  const getToggleColors = () => {
    if (theme.palette.mode === 'dark') {
      return {
        borderColor: '#4caf50', // Dark green
        color: '#4caf50', // Dark green
        hoverBorderColor: '#66bb6a', // Lighter green
        hoverBgColor: 'rgba(76, 175, 80, 0.1)', // Green with opacity
        hoverColor: '#66bb6a', // Lighter green
      };
    } else {
      return {
        borderColor: '#000000', // Dark black
        color: '#000000', // Dark black
        hoverBorderColor: '#333333', // Darker black
        hoverBgColor: 'rgba(0, 0, 0, 0.04)', // Black with opacity
        hoverColor: '#333333', // Darker black
      };
    }
  };

  const colors = getToggleColors();

  return (
    <Box>
      <Tooltip title="Toggle Navbar Position">
        <Button
          onClick={handleClick}
          variant="outlined"
          size="small"
          startIcon={<Settings />}
          endIcon={getPositionIcon()}
          sx={{
            minWidth: 'auto',
            px: 2,
            py: 1,
            borderRadius: 2,
            borderColor: colors.borderColor,
            color: colors.color,
            '&:hover': {
              borderColor: colors.hoverBorderColor,
              bgcolor: colors.hoverBgColor,
              color: colors.hoverColor,
            },
          }}
        >
          <Typography
            variant="caption"
            sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}
          >
            {getPositionText()}
          </Typography>
        </Button>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          },
        }}
      >
        <MenuItem
          onClick={() => handlePositionChange('top')}
          selected={position === 'top'}
          sx={{
            '&.Mui-selected': {
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)',
              '&:hover': {
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(76, 175, 80, 0.1)'
                    : 'rgba(0, 0, 0, 0.04)',
              },
            },
          }}
        >
          <ListItemIcon>
            <ViewHeadline
              color={
                position === 'top'
                  ? theme.palette.mode === 'dark'
                    ? 'primary'
                    : 'inherit'
                  : 'inherit'
              }
            />
          </ListItemIcon>
          <ListItemText>
            <Typography
              variant="body2"
              fontWeight={position === 'top' ? 600 : 400}
            >
              Top Navbar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Traditional horizontal navigation
            </Typography>
          </ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => handlePositionChange('left')}
          selected={position === 'left'}
          sx={{
            '&.Mui-selected': {
              bgcolor:
                theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.1)'
                  : 'rgba(0, 0, 0, 0.04)',
              '&:hover': {
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(76, 175, 80, 0.1)'
                    : 'rgba(0, 0, 0, 0.04)',
              },
            },
          }}
        >
          <ListItemIcon>
            <ViewSidebar
              color={
                position === 'left'
                  ? theme.palette.mode === 'dark'
                    ? 'primary'
                    : 'inherit'
                  : 'inherit'
              }
            />
          </ListItemIcon>
          <ListItemText>
            <Typography
              variant="body2"
              fontWeight={position === 'left' ? 600 : 400}
            >
              Left Sidebar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Modern vertical navigation
            </Typography>
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default NavbarToggle;
