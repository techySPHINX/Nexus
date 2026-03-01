import { useState } from 'react';
import { Button, Menu, MenuItem, Box, Typography } from '@mui/material';
import {
  DoneRounded,
  EditRounded,
  ArrowDropDownRounded,
} from '@mui/icons-material';

const EditToggleMenu = (
  isEditMode: boolean,
  setIsEditMode: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  //   const [editMode, setEditMode] = useState('off'); // 'off', 'on', 'readonly'
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget as HTMLElement);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleModeChange = (mode: string) => {
    setIsEditMode(mode === 'on');
    handleClose();
  };

  const getModeIcon = () => {
    switch (isEditMode ? 'on' : 'off') {
      case 'on':
        return <DoneRounded sx={{ color: 'success.main' }} />;
      default:
        return <EditRounded />;
    }
  };

  const getModeLabel = () => {
    switch (isEditMode ? 'on' : 'off') {
      case 'on':
        return 'Edit Mode: On';
      default:
        return 'Edit Mode: Off';
    }
  };

  const getModeColor = () => {
    switch (isEditMode ? 'on' : 'off') {
      case 'on':
        return 'success';
      default:
        return 'primary';
    }
  };

  return (
    <Box>
      <Button
        size="small"
        startIcon={getModeIcon()}
        endIcon={<ArrowDropDownRounded />}
        variant={isEditMode ? 'contained' : 'outlined'}
        onClick={handleClick}
        color={getModeColor()}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          minWidth: 160,
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: 1,
          },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {getModeLabel()}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 180,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        <MenuItem
          onClick={() => handleModeChange('off')}
          selected={!isEditMode}
          sx={{
            gap: 1.5,
            py: 1,
            '&.Mui-selected': {
              bgcolor: 'action.selected',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
            }}
          >
            <EditRounded fontSize="small" color="disabled" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                Off
              </Typography>
              <Typography variant="caption" color="text.secondary">
                View only mode
              </Typography>
            </Box>
            {!isEditMode && <DoneRounded fontSize="small" color="primary" />}
          </Box>
        </MenuItem>

        <MenuItem
          onClick={() => handleModeChange('on')}
          selected={isEditMode}
          sx={{
            gap: 1.5,
            py: 1,
            '&.Mui-selected': {
              bgcolor: 'action.selected',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
            }}
          >
            <DoneRounded fontSize="small" color="success" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                On
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Full edit access
              </Typography>
            </Box>
            {isEditMode && <DoneRounded fontSize="small" color="primary" />}
          </Box>
        </MenuItem>

        {/* <MenuItem
          onClick={() => handleModeChange('readonly')}
          selected={isEditMode === 'readonly'}
          sx={{
            gap: 1.5,
            py: 1,
            '&.Mui-selected': {
              bgcolor: 'action.selected',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              width: '100%',
            }}
          >
            <EditRounded fontSize="small" color="warning" />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                Read Only
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Can view but not edit
              </Typography>
            </Box>
          </Box>
        </MenuItem> */}
      </Menu>
    </Box>
  );
};

export default EditToggleMenu;
