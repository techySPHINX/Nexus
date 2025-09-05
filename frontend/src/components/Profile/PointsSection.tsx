import React from 'react';
import { UserPoints } from '@/types/profileType';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import { Score } from '@mui/icons-material';

interface PointsSectionProps {
  userPoints?: UserPoints;
}

const PointsSection: React.FC<PointsSectionProps> = ({ userPoints }) => (
  <Box sx={{ mb: 3 }}>
    <Typography
      variant="h6"
      sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
    >
      <Score sx={{ mr: 1 }} /> Points
    </Typography>
    <Typography variant="body1" color="text.primary">
      {userPoints?.points ?? 0} points
    </Typography>
    {userPoints?.transactions && userPoints.transactions.length > 0 && (
      <List>
        {userPoints.transactions.map((tx, idx) => (
          <ListItem key={idx}>
            <ListItemText
              primary={`${tx.points > 0 ? '+' : ''}${tx.points} (${tx.type})`}
              secondary={new Date(tx.createdAt).toLocaleDateString()}
            />
          </ListItem>
        ))}
      </List>
    )}
  </Box>
);

export default PointsSection;
