import { Box, Button, Card, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';

export default function RouteUnavailable() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 720,
          width: '100%',
          p: 4,
          textAlign: 'center',
          bgcolor: isDark ? 'background.paper' : 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <SentimentVeryDissatisfiedIcon
            sx={{
              fontSize: 56,
              color: 'text.secondary',
            }}
          />
        </Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Page unavailable
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          The page you tried to open doesn't exist or you don't have access to
          it.
          <br />
          Check the URL or return to a safe page.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            color="primary"
          >
            Go to Home
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
