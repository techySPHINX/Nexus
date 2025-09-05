import React from 'react';
import { Event } from '@/types/profileType';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';

interface EventsSectionProps {
  events?: Event[];
}

const EventsSection: React.FC<EventsSectionProps> = ({ events }) => (
  <Box sx={{ mb: 3 }}>
    <Typography
      variant="h6"
      sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
    >
      <EventIcon sx={{ mr: 1 }} /> Events
    </Typography>
    {events && events.length > 0 ? (
      <List>
        {events.map((event) => (
          <ListItem key={event.id}>
            <ListItemText primary={event.title} secondary={event.date} />
          </ListItem>
        ))}
      </List>
    ) : (
      <Typography variant="body2" color="text.secondary">
        No events yet
      </Typography>
    )}
  </Box>
);

export default EventsSection;
