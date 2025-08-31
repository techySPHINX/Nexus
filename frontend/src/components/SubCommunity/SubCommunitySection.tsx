import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Grid } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { SubCommunityCard } from './SubCommunityCard';
import { SubCommunity } from '../../types/subCommunity';

interface SubCommunitySectionProps {
  title: string;
  type: string;
  communities: SubCommunity[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  initialCount?: number;
}

export const SubCommunitySection: React.FC<SubCommunitySectionProps> = ({
  title,
  type,
  communities,
  hasMore = false,
  onLoadMore,
  initialCount = 6,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const displayedCommunities = showAll
    ? communities
    : communities.slice(0, initialCount);

  const handleShowMore = async () => {
    if (showAll) {
      setShowAll(false);
      return;
    }

    if (hasMore && onLoadMore && type !== 'all') {
      setIsLoadingMore(true);
      try {
        await onLoadMore();
        setShowAll(true);
      } catch (error) {
        console.error('Failed to load more communities:', error);
      } finally {
        setIsLoadingMore(false);
      }
    } else {
      setShowAll(true);
    }
  };

  // Don't show section if no communities
  if (communities.length === 0) return null;

  // Don't show "Show more" for recommended (type 'all')
  const shouldShowMoreButton =
    type !== 'all' && (hasMore || communities.length > initialCount);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        component="h2"
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          paddingBottom: '8px',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          width: 'fit-content',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            color: 'primary.main',
            borderColor: 'primary.dark',
            '& .section-chevron': {
              transform: 'translateX(4px)',
              color: 'primary.dark',
            },
          },
        }}
      >
        {title}
        <Box
          component="span"
          className="section-chevron"
          sx={{
            color: 'primary.main',
            fontSize: '1.3em',
            fontWeight: 'bold',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          ›
        </Box>
      </Typography>

      <Grid container spacing={3}>
        {displayedCommunities.map((subCom) => (
          <Grid item xs={12} sm={6} md={6} key={subCom.id}>
            <SubCommunityCard subCommunity={subCom} />
          </Grid>
        ))}
      </Grid>

      {shouldShowMoreButton && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            onClick={handleShowMore}
            variant="outlined"
            sx={{
              minWidth: '200px',
              color: 'primary.main',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
            }}
            startIcon={showAll ? <ExpandLess /> : <ExpandMore />}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <CircularProgress size={16} />
            ) : showAll ? (
              'Show less'
            ) : (
              `Show ${communities.length - initialCount} more communities`
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
};
