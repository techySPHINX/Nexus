import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  Divider,
  Button,
  Skeleton,
  Chip,
  Stack,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useNews } from '@/contexts/NewsContext';

type RecentNewsProps = {
  compact?: boolean;
};

export default function RecentNews({ compact = false }: RecentNewsProps) {
  const { news, loadNews, loading } = useNews();

  useEffect(() => {
    // load most recent 5 items
    loadNews(1, 5).catch(() => {});
  }, [loadNews]);

  const items = news.slice(0, 5);
  const hasItems = items.length > 0;

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 2.5 }}
      role="region"
      aria-label="Recent news"
    >
      <CardContent sx={{ p: compact ? { xs: 0.75, sm: 1.25 } : { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          <Typography
            variant={compact ? 'subtitle2' : 'h6'}
            sx={{ fontWeight: 700, fontSize: compact ? '0.7rem' : undefined }}
          >
            Recent News
          </Typography>
          {hasItems && (
            <Chip
              size="small"
              variant="outlined"
              label={`${items.length} update${items.length === 1 ? '' : 's'}`}
            />
          )}
        </Box>

        {loading && news.length === 0 ? (
          <Stack spacing={1.25}>
            {[0, 1, 2].map((skeletonItem) => (
              <Box key={`recent-news-skeleton-${skeletonItem}`}>
                <Box sx={{ display: 'flex', gap: 1.25 }}>
                  <Skeleton variant="rounded" width={52} height={52} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" height={22} />
                    <Skeleton variant="text" width="95%" height={18} />
                  </Box>
                </Box>
                {skeletonItem < 2 && <Divider sx={{ mt: 1.25 }} />}
              </Box>
            ))}
          </Stack>
        ) : !hasItems ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 1.5,
              px: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              No recent news available.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                void loadNews(1, 5);
              }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <List disablePadding>
            {items.map((n, index) => (
              <React.Fragment key={n.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    to={`/news/${n.slug}`}
                    aria-label={`Open news: ${n.title}`}
                    sx={{
                      borderRadius: 1.5,
                      px: 0,
                      py: { xs: 1.25, sm: 1 },
                      minHeight: 44,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Avatar
                      variant="rounded"
                      src={n.imageUrl || '/nexus.webp'}
                      alt={n.title}
                      sx={{
                        width: compact ? 30 : 52,
                        height: compact ? 30 : 52,
                        mr: compact ? 0.5 : 1.25,
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant={compact ? 'caption' : 'subtitle2'}
                        sx={{
                          fontWeight: 700,
                          fontSize: compact ? '0.6rem' : undefined,
                          display: '-webkit-box',
                          WebkitLineClamp: compact ? 1 : 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 0.25,
                        }}
                      >
                        {n.title}
                      </Typography>
                      {!compact && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {n.summary || 'Open to read full update.'}
                        </Typography>
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
                {index < items.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: compact ? 1 : 1.5 }}>
          <Button
            component={Link}
            to="/news"
            size={compact ? 'small' : 'small'}
            variant="text"
            aria-label="View all news updates"
            sx={compact ? { minWidth: 0, px: 0.25, fontSize: '0.6rem' } : undefined}
          >
            {compact ? 'All' : 'View all'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
