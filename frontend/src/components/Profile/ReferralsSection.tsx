import React from 'react';
import { Referral } from '@/types/profileType';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import { Business } from '@mui/icons-material';

interface ReferralsSectionProps {
  referrals?: Referral[];
}

const ReferralsSection: React.FC<ReferralsSectionProps> = ({ referrals }) => (
  <Box sx={{ mb: 3 }}>
    <Typography
      variant="h6"
      sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
    >
      <Business sx={{ mr: 1 }} /> Referrals
    </Typography>
    {referrals && referrals.length > 0 ? (
      <List>
        {referrals.map((ref) => (
          <ListItem key={ref.id}>
            <ListItemText
              primary={`${ref.company} - ${ref.jobTitle}`}
              secondary={ref.status}
            />
          </ListItem>
        ))}
      </List>
    ) : (
      <Typography variant="body2" color="text.secondary">
        No referrals yet
      </Typography>
    )}
  </Box>
);

export default ReferralsSection;
