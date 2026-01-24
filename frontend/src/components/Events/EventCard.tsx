import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  useTheme,
  Stack,
  CardActionArea,
  CardMedia,
  alpha,
} from '@mui/material';
import {
  CalendarMonth,
  LocationOn,
  Edit,
  Delete,
  Share,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EventService } from '@/services/EventService';
import { useEventContext } from '@/contexts/eventContext';
import type { Event } from '@/types/Event';

interface EventCardProps {
  event: Event;
  variant?: 'grid' | 'list';
}

const EventCard: FC<EventCardProps> = ({ event, variant = 'grid' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchEvents, fetchUpcoming } = useEventContext();
  const [imageLoaded, setImageLoaded] = useState(false);

  const canAdmin = user?.role === 'ADMIN' || user?.id === event.authorId;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!event.id) return;
    const confirmed = window.confirm(
      'Are you sure you want to delete this event? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await EventService.remove(event.id);
      await fetchEvents();
      await fetchUpcoming();
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: `/events/${event.id}`,
      });
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/events/${event.id}`
      );
      // Add toast notification here
      alert('Event link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleCardClick = () => {
    navigate(`/events/${event.id}`);
  };

  if (variant === 'list') {
    return (
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <Card
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
              borderColor: alpha(theme.palette.primary.main, 0.3),
            },
          }}
        >
          <CardActionArea onClick={handleCardClick}>
            <Box sx={{ display: 'flex', height: 200 }}>
              {/* Image Section */}
              <Box sx={{ width: 280, position: 'relative', flexShrink: 0 }}>
                <CardMedia
                  component="img"
                  image={event.imageUrl || '/api/placeholder/400/300'}
                  alt={event.title}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                  sx={{
                    height: '100%',
                    objectFit: 'cover',
                    opacity: imageLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                  }}
                />
                {!imageLoaded && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}33, ${theme.palette.secondary.main}33)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CalendarMonth
                      sx={{ fontSize: 40, color: 'primary.main' }}
                    />
                  </Box>
                )}

                {/* Category Badge */}
                <Chip
                  label={event.category || 'Event'}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: alpha(theme.palette.primary.main, 0.9),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>

              {/* Content Section */}
              <CardContent
                sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {event.title}
                  </Typography>

                  {event.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {event.description}
                    </Typography>
                  )}

                  {/* Metadata */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight={500}>
                        {formatDate(event.date)}
                      </Typography>
                    </Box>

                    {event.location && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <LocationOn fontSize="small" color="primary" />
                        <Typography variant="body2" color="text.secondary">
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
                      sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}
                    >
                      {event.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {event.registrationLink ? (
                      <Button
                        component="a"
                        variant="contained"
                        size="small"
                        href={event.registrationLink ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          px: 2,
                        }}
                      >
                        Register Now
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        View Details
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Box>
          </CardActionArea>
        </Card>
      </motion.div>
    );
  }

  // Grid Variant (default)
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
          backdropFilter: 'blur(10px)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            boxShadow: `0 20px 60px ${alpha(theme.palette.primary.main, 0.15)}`,
            borderColor: alpha(theme.palette.primary.main, 0.3),
          },
        }}
      >
        <CardActionArea
          onClick={handleCardClick}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          {/* Image Section */}
          <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
            <CardMedia
              component="img"
              image={event.imageUrl || '/api/placeholder/400/300'}
              alt={event.title}
              onLoad={() => setImageLoaded(true)}
              sx={{
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
            {!imageLoaded && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}33, ${theme.palette.secondary.main}33)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarMonth sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            )}

            {/* Category Badge */}
            <Chip
              label={event.category || 'Event'}
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: alpha(theme.palette.primary.main, 0.9),
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
              }}
            />

            {/* Admin Actions */}
            {canAdmin && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  display: 'flex',
                  gap: 0.5,
                  background: alpha('#000', 0.6),
                  borderRadius: 2,
                  p: 0.5,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <IconButton
                  size="small"
                  sx={{ color: 'white' }}
                  component={Link}
                  to={`/admin/events/create?id=${event.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ color: 'white' }}
                  onClick={handleDelete}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            )}

            {/* Action Overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                p: 2,
                background: `linear-gradient(transparent 0%, ${alpha('#000', 0.7)} 100%)`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  sx={{ color: 'white' }}
                  onClick={handleShare}
                >
                  <Share fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Content Section */}
          <CardContent
            sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                flex: 1,
              }}
            >
              {event.title}
            </Typography>

            {event.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 2,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {event.description}
              </Typography>
            )}

            {/* Metadata */}
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth fontSize="small" color="primary" />
                <Typography variant="body2" fontWeight={500}>
                  {formatDate(event.date)}
                </Typography>
              </Box>

              {event.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="primary" />
                  <Typography variant="body2" color="text.secondary">
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
                sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}
              >
                {event.tags.slice(0, 2).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Stack>
            )}
            <Button
              component="a"
              variant="contained"
              fullWidth
              href={event.registrationLink ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                py: 1,
                mt: 'auto',
              }}
            >
              {event.registrationLink ? 'Register Now' : 'View Details'}
            </Button>
          </CardContent>
        </CardActionArea>
      </Card>
    </motion.div>
  );
};

export default EventCard;
