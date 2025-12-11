import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useNews } from '@/contexts/NewsContext';

export default function RecentNews() {
  const { news, loadNews, loading } = useNews();

  useEffect(() => {
    // load most recent 5 items
    loadNews(0, 5).catch(() => {});
  }, [loadNews]);

  const items = news.slice(0, 5);

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          Recent News
        </Typography>

        {loading && news.length === 0 ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <List disablePadding>
            {items.map((n) => (
              <React.Fragment key={n.id}>
                <ListItem alignItems="flex-start" sx={{ py: 1 }}>
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      src={n.imageUrl || '/nexus.png'}
                      alt={n.title}
                      sx={{ width: 56, height: 56, mr: 1 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Link
                        to={`/news/${n.slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {n.title}
                        </Typography>
                      </Link>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {n.summary}
                      </Typography>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button component={Link} to="/news" size="small">
            View all
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
