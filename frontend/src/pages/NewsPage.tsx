import NewsList from '@/components/News/NewsList';
import { Container } from '@mui/material';

export default function NewsPage() {
  return (
    <Container sx={{ py: 1 }}>
      <NewsList />
    </Container>
  );
}
