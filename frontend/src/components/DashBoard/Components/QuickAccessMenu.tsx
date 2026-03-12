import { FC } from 'react';
import { Card, Box, Button, Typography, Divider } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const QuickAccessMenu: FC = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const containerClasses = isDark
    ? 'rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow bg-neutral-900 border-neutral-700 text-neutral-100'
    : 'bg-white rounded-xl border border-emerald-100 p-6 shadow-sm';
  return (
    <Card
      className={containerClasses}
      sx={{ borderRadius: 2, overflow: 'hidden' }}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={1}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Quick Actions
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr' }} gap={1}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/profile')}
          startIcon={<OpenInNewIcon />}
        >
          View Profile
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/feed')}
          startIcon={<OpenInNewIcon />}
        >
          View Feed
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/connections')}
          startIcon={<OpenInNewIcon />}
        >
          Find Connections
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={() => navigate('/jobs')}
          startIcon={<OpenInNewIcon />}
        >
          Opportunities
        </Button>
      </Box>
    </Card>
  );
};

export default QuickAccessMenu;
