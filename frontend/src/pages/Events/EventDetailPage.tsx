import { FC, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  IconButton,
  Grid,
  Container,
  Breadcrumbs,
  Divider,
  Avatar,
  Paper,
  Fade,
} from '@mui/material';
import {
  Edit,
  Delete,
  CalendarMonth,
  LocationOn,
  ArrowBack,
  Share,
  Bookmark,
  BookmarkBorder,
  Person,
  AccessTime,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { EventService } from '@/services/EventService';
import { useEventContext } from '@/contexts/eventContext';

type Event = {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string | null;
  registrationLink?: string | null;
  category?: string;
  imageUrl?: string | null;
  tags?: string[];
  authorId?: string;
  author?: {
    name: string;
    avatar?: string;
  };
  duration?: string;
  capacity?: number;
};

const EventDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { fetchById, fetchEvents, fetchUpcoming } = useEventContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void (async () => {
      try {
        const ev = await fetchById(id);
        setEvent(ev || null);
      } catch (e) {
        console.error(e);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, fetchById]);

  const handleDelete = async () => {
    if (!event) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this event? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      await EventService.remove(event.id);
      await fetchEvents();
      await fetchUpcoming();
      navigate('/events', {
        state: { message: 'Event deleted successfully' },
      });
    } catch {
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You can add a toast notification here
      alert('Event link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/events')}
            sx={{ mt: 2 }}
          >
            Back to Events
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Event Not Found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            The event you're looking for doesn't exist or has been removed.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/events')}>
            Browse All Events
          </Button>
        </Paper>
      </Container>
    );
  }

  const dateInfo = formatDate(event.date);

  return (
    <Fade in={!loading} timeout={500}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 4 }}>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<ArrowBack />}
            sx={{ color: 'text.secondary' }}
          >
            Back
          </Button>
          <Typography color="text.primary">{event.title}</Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                mb: 3,
              }}
            >
              {event.imageUrl && (
                <Box
                  sx={{
                    position: 'relative',
                    height: { xs: 240, md: 400 },
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                    }}
                  >
                    {event.category && (
                      <Chip
                        label={event.category}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}

              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    mb: 3,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {event.title}
                </Typography>

                {/* Event Meta Information */}
                <Stack spacing={2} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth color="primary" />
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {dateInfo.full}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dateInfo.time}
                        </Typography>
                      </Box>
                    </Box>

                    {event.duration && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <AccessTime color="primary" />
                        <Typography variant="body2">
                          {event.duration}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {event.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="primary" />
                      <Typography variant="body1" fontWeight={500}>
                        {event.location}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}
                  >
                    {event.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Stack>
                )}

                <Divider sx={{ my: 4 }} />

                {/* Description */}
                {event.description && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      About This Event
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        lineHeight: 1.8,
                        whiteSpace: 'pre-line',
                        fontSize: '1.1rem',
                      }}
                    >
                      {event.description}
                    </Typography>
                  </Box>
                )}

                {/* Additional Info */}
                {(event.capacity || event.author) && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      Additional Information
                    </Typography>
                    <Stack spacing={1}>
                      {event.capacity && (
                        <Typography variant="body1">
                          <strong>Capacity:</strong> {event.capacity} attendees
                        </Typography>
                      )}
                      {event.author && (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Avatar sx={{ width: 32, height: 32 }}>
                            <Person />
                          </Avatar>
                          <Typography variant="body1">
                            <strong>Organizer:</strong> {event.author.name}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Action Card */}
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                <Stack spacing={2}>
                  {event.registrationLink ? (
                    <Button
                      component="a"
                      href={event.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        py: 1.5,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                    >
                      Register Now
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      disabled
                      sx={{ py: 1.5 }}
                    >
                      Registration Closed
                    </Button>
                  )}

                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      sx={{
                        flex: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      {isBookmarked ? (
                        <Bookmark color="primary" />
                      ) : (
                        <BookmarkBorder />
                      )}
                    </IconButton>
                    <IconButton
                      onClick={handleShare}
                      sx={{
                        flex: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Share />
                    </IconButton>
                  </Stack>

                  {/* Admin Actions */}
                  {(user?.role === 'ADMIN' || user?.id === event.authorId) && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Stack spacing={1}>
                        <Button
                          component={Link}
                          to={`/admin/events/create?id=${event.id}`}
                          variant="outlined"
                          startIcon={<Edit />}
                          fullWidth
                        >
                          Edit Event
                        </Button>
                        <Button
                          onClick={handleDelete}
                          variant="outlined"
                          color="error"
                          startIcon={<Delete />}
                          fullWidth
                        >
                          Delete Event
                        </Button>
                      </Stack>
                    </>
                  )}
                </Stack>
              </Paper>

              {/* Quick Info */}
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Event Details
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      DATE & TIME
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {dateInfo.full}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dateInfo.time}
                    </Typography>
                  </Box>

                  {event.location && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        LOCATION
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {event.location}
                      </Typography>
                    </Box>
                  )}

                  {event.category && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        CATEGORY
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {event.category}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Fade>
  );
};

export default EventDetailPage;
