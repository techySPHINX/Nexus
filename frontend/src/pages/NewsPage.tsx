import NewsList from '@/components/News/NewsList';
import { Box, Container, Paper, Typography } from '@mui/material';

export default function NewsPage() {
  return (
    <Container sx={{ py: 2 }}>
      <Paper
        variant="outlined"
        sx={{ mb: 2.5, p: { xs: 2, md: 2.5 }, borderRadius: 2.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            News
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Latest updates from the campus and alumni network
          </Typography>
        </Box>
      </Paper>
      <NewsList />
    </Container>
  );
}
