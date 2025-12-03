// import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import Card from '@mui/material/Card';
import { ArrowRight } from 'lucide-react';
import { useDashboardContext } from '@/contexts/DashBoardContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Button,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { EventService } from '@/services/EventService';

export default function UpcomingEvents() {
  const { isDark } = useTheme();
  const {
    upcomingEvents: upcoming,
    getUpcomingEvents,
    loading,
  } = useDashboardContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Only fetch if we don't already have upcoming events to avoid repeated calls
    if (!getUpcomingEvents) return;
    if (upcoming && upcoming.length > 0) return;
    void getUpcomingEvents(3);
  }, [getUpcomingEvents, upcoming]);

  const events = upcoming || [];

  // Use a unique purple accent for upcoming events to distinguish from other cards
  const containerClasses = isDark
    ? 'rounded-xl border p-6 shadow-sm hover:shadow-md transition-shadow bg-neutral-900 border-neutral-700 text-sky-100'
    : 'bg-white rounded-xl border border-emerald-100 p-6 shadow-sm';

  const eventCardClass = isDark
    ? 'p-3 rounded-lg border border-neutral-700 hover:border-sky-500 hover:bg-neutral-800 transition-all cursor-pointer group flex items-center justify-between'
    : 'p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all cursor-pointer group flex items-center justify-between';

  const metaClass = isDark
    ? 'text-xs text-neutral-300'
    : 'text-xs text-gray-600';
  const { user } = useAuth();

  return (
    <Card className={containerClasses}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className={
            isDark
              ? 'text-lg font-bold text-neutral-100'
              : 'text-lg font-bold text-gray-900'
          }
        >
          Upcoming Events
        </h3>
        <Button component={Link} to="/events" size="small">
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
      {loading.events && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}
      {!loading.events && events.length === 0 && <div>Not Available</div>}
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className={eventCardClass}>
            <Box
              sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              {/* Title */}
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600 }}
                className={
                  isDark
                    ? 'text-sky-100 hover:text-sky-300'
                    : 'text-gray-900 hover:text-emerald-600'
                }
                onClick={() => {
                  // Navigate to event detail page
                  navigate(`/events/${event.id}`);
                }}
              >
                {event.title}
              </Typography>

              {/* Row 1 — Category (left) | Date (right) */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Chip
                  size="small"
                  label={event.category || 'General'}
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: isDark
                      ? 'rgb(2 132 199)'
                      : 'rgb(5 150 105)', // sky-600 / emerald-600
                    color: 'white',
                  }}
                />

                <Typography variant="caption" className={metaClass}>
                  {new Date(event.date).toLocaleString()}
                </Typography>
              </Box>

              {/* Row 2 — Location (left) | Days Left (right) */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="caption" className={metaClass}>
                  {event.location || 'Online'}
                </Typography>

                <Chip
                  size="small"
                  label={(() => {
                    const now = new Date();
                    const evDate = new Date(event.date);
                    const diff = Math.ceil(
                      (evDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    if (diff > 1) return `${diff} days left`;
                    if (diff === 1) return '1 day left';
                    if (diff === 0) return 'Today';
                    return 'Passed';
                  })()}
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    backgroundColor: isDark
                      ? 'rgb(2 132 199)'
                      : 'rgb(5 150 105)', // sky-600 / emerald-600
                    color: 'white',
                  }}
                />
              </Box>
            </Box>

            {/* Admin Actions */}
            {(user?.role === 'ADMIN' || user?.id === event.authorId) && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  alignItems: 'flex-end',
                }}
              >
                <IconButton
                  size="small"
                  component={Link}
                  to={`/admin/events/create?id=${event.id}`}
                  aria-label="edit"
                >
                  <EditIcon fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  aria-label="delete"
                  onClick={async () => {
                    const ok = window.confirm('Delete this event?');
                    if (!ok) return;
                    try {
                      await EventService.remove(event.id);
                      if (getUpcomingEvents) await getUpcomingEvents(3);
                      alert('Event deleted');
                    } catch {
                      alert('Failed to delete event');
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
