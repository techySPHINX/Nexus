import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Chip,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { SubCommunityCard } from './SubCommunityCard';
import { SubCommunity } from '../../types/subCommunity';

interface SubCommunitySectionProps {
  title: string;
  type: string | { id: string; name: string };
  communities: SubCommunity[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  initialCount?: number;
  isLoading?: boolean;
  remainingCount?: number | undefined;
}

export const SubCommunitySection: React.FC<SubCommunitySectionProps> = ({
  title,
  type,
  communities,
  hasMore = false,
  onLoadMore,
  initialCount = 6,
  isLoading = false,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const typeKey = typeof type === 'string' ? type : type.name?.toLowerCase();

  const displayedCommunities = showAll
    ? communities
    : communities.slice(0, initialCount);

  const handleShowMore = async () => {
    if (showAll) {
      setShowAll(false);
      return;
    }

    // If we already have more than the initial count loaded, just expand.
    if (communities.length > initialCount) {
      setShowAll(true);
      return;
    }

    // Otherwise, if there are more pages available, load the next page and
    // then expand. For recommended ('all') sections we don't attempt to load
    // via this button.
    if (hasMore && onLoadMore && typeKey !== 'all') {
      if (!isLoading) setIsLoadingMore(true);
      try {
        await onLoadMore();
        setShowAll(true);
      } catch (error) {
        console.error('Failed to load more communities:', error);
      } finally {
        if (!isLoading) setIsLoadingMore(false);
      }
      return;
    }

    // Fallback: just expand
    setShowAll(true);
  };

  const handleLoadMore = async () => {
    if (!onLoadMore) return;
    if (!isLoading) setIsLoadingMore(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Failed to load more communities:', error);
    } finally {
      if (!isLoading) setIsLoadingMore(false);
    }
  };

  // Don't show section if no communities
  if (communities.length === 0) return null;

  // Don't show "Show more" for recommended (type 'all')
  const shouldShowMoreButton =
    typeKey !== 'all' && (hasMore || communities.length > initialCount);

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          mb: 2.5,
          px: 2,
          py: 1.5,
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            minWidth: 0,
          }}
        >
          <Box
            component="span"
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              boxShadow: (theme) =>
                `0 0 0 4px ${theme.palette.primary.light}22`,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>
        </Box>

        <Chip
          size="small"
          label={`${communities.length}`}
          sx={{
            fontWeight: 600,
            borderRadius: 999,
          }}
          color="primary"
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {displayedCommunities.map((subCom) => (
          <Grid item xs={12} sm={6} md={6} key={subCom.id}>
            <SubCommunityCard subCommunity={subCom} />
          </Grid>
        ))}
      </Grid>

      {shouldShowMoreButton && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 2 }}>
          {showAll ? (
            // When expanded, show both "Show less" and "Load more" (if
            // available). This allows the user to collapse while still
            // loading additional pages.
            <>
              <Button
                onClick={() => setShowAll(false)}
                variant="outlined"
                sx={{
                  minWidth: '160px',
                  color: 'primary.main',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 2,
                }}
                startIcon={<ExpandLess />}
                disabled={!!isLoading}
              >
                Show less
              </Button>

              {hasMore && (
                <Button
                  onClick={handleLoadMore}
                  variant="outlined"
                  sx={{
                    minWidth: '160px',
                    color: 'primary.main',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                  }}
                  startIcon={<ExpandMore />}
                  disabled={!!isLoading || isLoadingMore}
                >
                  {isLoading || isLoadingMore ? (
                    <CircularProgress size={16} />
                  ) : (
                    `Load more`
                  )}
                </Button>
              )}
            </>
          ) : (
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
              startIcon={<ExpandMore />}
              disabled={!!isLoading || isLoadingMore}
            >
              {isLoading || isLoadingMore ? (
                <CircularProgress size={16} />
              ) : hasMore && communities.length <= initialCount ? (
                `Load more`
              ) : (
                `Show more`
              )}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};
