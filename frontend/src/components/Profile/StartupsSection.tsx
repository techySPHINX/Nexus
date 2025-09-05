import React from 'react';
import { Startup } from '@/types/profileType';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';

interface StartupsSectionProps {
  startups: Startup[];
}

const StartupsSection: React.FC<StartupsSectionProps> = ({ startups }) => (
  <Box>
    <Typography
      variant="h6"
      sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
    >
      Startups
    </Typography>
    {startups && startups.length > 0 ? (
      <Grid container spacing={2}>
        {startups.map((startup) => (
          <Grid item xs={12} sm={6} key={startup.id}>
            <Card variant="outlined" sx={{ minHeight: 180 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {startup.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {startup.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Status: {startup.status}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    ) : (
      <Typography variant="body2" color="text.secondary">
        No startups yet
      </Typography>
    )}
  </Box>
);

export default StartupsSection;
