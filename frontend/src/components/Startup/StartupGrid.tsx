import React from 'react';
import { Grid, Box, Skeleton } from '@mui/material';
import StartupCard from './StartupCard';
import { StartupSummary } from '@/types/StartupType';

interface Props {
  startups: StartupSummary[];
  loading?: boolean;
  onFollowToggle?: (
    startup: StartupSummary,
    isFollowing: boolean
  ) => void | Promise<void>;
  onView?: (startup: StartupSummary) => void | Promise<void>;
  onEdit?: (startup: StartupSummary) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}

const StartupGrid: React.FC<Props> = ({
  startups,
  loading = false,
  onFollowToggle,
  onView,
  onEdit,
  onDelete,
}) => {
  if (loading && startups.length === 0) {
    // show skeletons (a small grid) while loading first page
    const skeletons = Array.from({ length: 8 }).map((_, i) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={`sk-${i}`}>
        <Box sx={{ p: 0.5 }}>
          <Skeleton
            variant="rectangular"
            height={160}
            sx={{ borderRadius: 2 }}
          />
          <Skeleton width="60%" sx={{ mt: 1 }} />
          <Skeleton width="40%" />
        </Box>
      </Grid>
    ));

    return (
      <Grid container spacing={3}>
        {skeletons}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {startups.map((s) => (
        <Grid item xs={12} sm={6} md={4} key={s.id}>
          <StartupCard
            startup={s}
            onFollowToggle={onFollowToggle}
            onView={() => onView?.(s)}
            onEdit={() => onEdit?.(s)}
            onDelete={() => onDelete?.(s.id)}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default StartupGrid;
