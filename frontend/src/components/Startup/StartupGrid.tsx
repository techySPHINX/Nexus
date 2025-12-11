import { FC } from 'react';
import { Box, Grid, Skeleton } from '@mui/material';
import StartupCard from './StartupCard';
import { StartupSummary } from '@/types/StartupType';
import { motion } from 'framer-motion';

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
  tab: number;
}

const StartupGrid: FC<Props> = ({
  startups,
  loading = false,
  onFollowToggle,
  onView,
  onEdit,
  onDelete,
  tab,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };
  if (loading && startups.length === 0) {
    // show skeletons matching the StartupCard layout
    const skeletons = Array.from({ length: 8 }).map((_, i) => (
      <Box key={`sk-${i}`} sx={{ width: '100%' }}>
        {/* image/banner */}
        <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Skeleton variant="rectangular" height={140} />
        </Box>

        {/* avatar + title + subtitle */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ ml: 1, flex: 1 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={16} sx={{ mt: 0.5 }} />
          </Box>
        </Box>

        {/* tags/chips */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          <Skeleton
            variant="rectangular"
            width={64}
            height={26}
            sx={{ borderRadius: 12 }}
          />
          <Skeleton
            variant="rectangular"
            width={80}
            height={26}
            sx={{ borderRadius: 12 }}
          />
        </Box>

        {/* actions (follow/view) */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Skeleton width={90} height={36} sx={{ borderRadius: 18 }} />
        </Box>
      </Box>
    ));

    return (
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          // show 1 column on extra-small screens, 2 columns on small and up
          gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
        }}
      >
        {skeletons}
      </Box>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Grid container spacing={3}>
        {startups.map((s) => (
          <Grid item xs={12} md={6} key={s?.id || Math.random()}>
            <motion.div variants={itemVariants}>
              <StartupCard
                startup={s}
                onFollowToggle={onFollowToggle}
                onView={() => onView?.(s)}
                onEdit={() => onEdit?.(s)}
                onDelete={() => onDelete?.(s.id)}
                tab={tab}
              />
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
};

export default StartupGrid;
