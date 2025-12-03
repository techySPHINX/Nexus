import { useEffect } from 'react';
import { useNews } from '@/contexts/NewsContext';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  Stack,
  Skeleton,
  Container,
  Button,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Share,
  MoreVert,
  CalendarMonth,
  Person,
  ArrowForward,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function NewsList() {
  const { news: items, loading, loadNews } = useNews();
  const { showNotification } = useNotification();
  const { isDark } = useTheme();

  useEffect(() => {
    loadNews(1, 10);
  }, [loadNews]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: '700',
            mb: 1,
            fontSize: { xs: '1.75rem', md: '2.125rem' },
          }}
        >
          News & Insights
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 3, fontSize: { xs: '0.95rem', md: '1rem' } }}
        >
          Stay updated with the latest industry trends and insights
        </Typography>
      </Box>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Main News Grid */}
        <Grid item xs={12}>
          {loading ? (
            // Loading Skeletons
            Array.from(new Array(4)).map((_, index) => (
              <Card key={index} sx={{ mb: 3, borderRadius: 2 }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <Skeleton
                        variant="rectangular"
                        sx={{ borderRadius: 2, height: { xs: 160, md: 200 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Skeleton
                        variant="text"
                        sx={{ mb: 1, height: { xs: 32, md: 40 } }}
                      />
                      <Skeleton
                        variant="text"
                        sx={{ height: { xs: 16, md: 20 }, mb: 2 }}
                        width="60%"
                      />
                      <Skeleton
                        variant="text"
                        sx={{ height: { xs: 48, md: 60 } }}
                      />
                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Skeleton variant="rounded" width={80} height={32} />
                        <Skeleton variant="rounded" width={80} height={32} />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          ) : items.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 6 },
                textAlign: 'center',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ mb: 1, fontSize: { xs: '1rem', md: '1.25rem' } }}
              >
                No news found
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}
              >
                Try adjusting your search or filter criteria
              </Typography>
            </Paper>
          ) : (
            items.map((n) => (
              <Card
                key={n.id}
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    borderColor: 'primary.light',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Grid container spacing={2} alignItems="center">
                    {/* Image Column */}
                    <Grid item xs={12} md={4}>
                      <Box
                        component={Link}
                        to={`/news/${n.slug}`}
                        sx={{ display: 'block', textDecoration: 'none' }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            height: { xs: 160, md: 200 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            position: 'relative',
                            bgcolor: 'grey.100',
                          }}
                        >
                          {n.imageUrl ? (
                            <Box
                              component="img"
                              src={n.imageUrl}
                              alt={n.title}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                },
                              }}
                            />
                          ) : (
                            <Box
                              component="img"
                              src="/nexus.png"
                              alt={n.title}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                transition: 'transform 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)',
                                },
                                bgcolor: isDark ? 'grey.800' : 'grey.200',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Grid>

                    {/* Content Column */}
                    <Grid item xs={12} md={8}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          {n.topic && (
                            <Chip
                              label={n.topic}
                              size="small"
                              sx={{
                                borderRadius: 1,
                                fontWeight: '500',
                                bgcolor: 'primary.50',
                                color: 'primary.700',
                                fontSize: { xs: '0.7rem', md: '0.8125rem' },
                              }}
                            />
                          )}
                        </Stack>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            sx={{
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              p: { xs: 0.5, md: 0.75 },
                            }}
                            onClick={() => {
                              const url = `${window.location.origin}/news/${n.slug}`;
                              const doCopy = async () => {
                                try {
                                  if (navigator.clipboard?.writeText) {
                                    await navigator.clipboard.writeText(url);
                                  } else {
                                    const input =
                                      document.createElement('input');
                                    input.value = url;
                                    document.body.appendChild(input);
                                    input.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(input);
                                  }
                                  showNotification?.(
                                    'Link copied to clipboard'
                                  );
                                } catch (err) {
                                  // silent fallback
                                  console.error('Copy failed', err);
                                }
                              };
                              void doCopy();
                            }}
                          >
                            <Share sx={{ fontSize: { xs: 16, md: 20 } }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              p: { xs: 0.5, md: 0.75 },
                            }}
                          >
                            <MoreVert sx={{ fontSize: { xs: 16, md: 20 } }} />
                          </IconButton>
                        </Box>
                      </Box>

                      <Link
                        to={`/news/${n.slug}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: '700',
                            mb: 1,
                            lineHeight: 1.3,
                            color: 'text.primary',
                            fontSize: { xs: '1.125rem', md: '1.5rem' },
                            '&:hover': {
                              color: 'primary.main',
                            },
                          }}
                        >
                          {n.title}
                        </Typography>
                      </Link>

                      {n.summary && (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            lineHeight: 1.6,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: { xs: '0.875rem', md: '1rem' },
                          }}
                        >
                          {n.summary}
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{
                          mt: 2,
                          color: 'text.secondary',
                          flexWrap: 'wrap',
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Person sx={{ fontSize: { xs: 14, md: 16 } }} />
                          <Typography
                            variant="caption"
                            sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                          >
                            {n.authorId || 'LinkedIn News'}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <CalendarMonth
                            sx={{ fontSize: { xs: 14, md: 16 } }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                          >
                            {n.publishedAt
                              ? new Date(n.publishedAt).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  }
                                )
                              : 'No date'}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: { xs: '0.7rem', md: '0.75rem' } }}
                        >
                          • 5 min read
                        </Typography>
                      </Stack>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 2,
                        }}
                      >
                        <Button
                          component={Link}
                          to={`/news/${n.slug}`}
                          endIcon={
                            <ArrowForward
                              sx={{ fontSize: { xs: 16, md: 20 } }}
                            />
                          }
                          size="small"
                          sx={{
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: '500',
                            fontSize: { xs: '0.75rem', md: '0.875rem' },
                            px: { xs: 1.5, md: 2 },
                            py: { xs: 0.5, md: 0.75 },
                          }}
                        >
                          Read More
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
