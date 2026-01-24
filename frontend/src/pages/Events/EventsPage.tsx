import { FC, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Grid,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  FilterList,
  ViewModule,
  ViewList,
  CalendarMonth,
} from '@mui/icons-material';
import EventCard from '@/components/Events/EventCard';
import { useEventContext } from '@/contexts/eventContext';

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'upcoming' | 'past' | 'today';

const EventsPage: FC = () => {
  const { events, loading, error, fetchEvents } = useEventContext();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const theme = useTheme();

  useEffect(() => {
    void fetchEvents({ status: 'UPCOMING', limit: 50 });
  }, [fetchEvents]);

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newViewMode: ViewMode | null
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleFilterChange = (
    _event: React.MouseEvent<HTMLElement>,
    newFilter: FilterType | null
  ) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      // Implement filter logic here
    }
  };

  // Extract unique categories
  const categories = [
    'all',
    ...new Set(events.map((event) => event.category).filter(Boolean)),
  ] as string[];

  // Filter events based on search and category
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 6, textAlign: 'left' }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            fontSize: { xs: '2.5rem', md: '3.5rem' },
          }}
        >
          Discover Events
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 'auto', mb: 4 }}
        >
          Explore upcoming events, workshops, and gatherings. Find your next
          opportunity to learn and connect.
        </Typography>
      </Box>

      {/* Controls Section */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'background.paper',
                },
              }}
            />
          </Grid>

          {/* Category Filter */}
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category === 'all' ? 'All Categories' : category}
                  clickable
                  variant={
                    selectedCategory === category ? 'filled' : 'outlined'
                  }
                  color={selectedCategory === category ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(category)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Grid>

          {/* View Controls */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <ToggleButtonGroup
                value={filter}
                exclusive
                onChange={handleFilterChange}
                size="small"
              >
                <ToggleButton value="upcoming">
                  <CalendarMonth sx={{ mr: 1 }} />
                  Upcoming
                </ToggleButton>
                <ToggleButton value="all">
                  <FilterList sx={{ mr: 1 }} />
                  All
                </ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
              >
                <ToggleButton value="grid">
                  <ViewModule />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Count */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}{' '}
          found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Showing {Math.min(filteredEvents.length, 50)} of {events.length} total
          events
        </Typography>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Error State */}
      {!loading && error && (
        <Paper sx={{ p: 4, textAlign: 'center', my: 4 }}>
          <Typography color="error" variant="h6" gutterBottom>
            Failed to load events
          </Typography>
          <Typography color="text.secondary">
            Please try refreshing the page or check your connection.
          </Typography>
        </Paper>
      )}

      {/* Events Grid/List */}
      <AnimatePresence mode="wait">
        {!loading && !error && (
          <motion.div
            key={viewMode}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <Grid container spacing={3}>
              {filteredEvents.map((event) => (
                <Grid
                  item
                  xs={12}
                  sm={viewMode === 'grid' ? 6 : 12}
                  md={viewMode === 'grid' ? 6 : 12}
                  lg={viewMode === 'grid' ? 4 : 12}
                  key={event.id}
                >
                  <motion.div variants={itemVariants}>
                    <EventCard
                      event={event}
                      variant={viewMode === 'list' ? 'list' : 'grid'}
                    />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!loading && !error && filteredEvents.length === 0 && (
        <Paper
          sx={{
            p: 8,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          }}
        >
          <CalendarMonth
            sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
          />
          <Typography variant="h5" gutterBottom color="text.secondary">
            No events found
          </Typography>
          <Typography color="text.secondary">
            Try adjusting your search criteria or check back later for new
            events.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default EventsPage;
