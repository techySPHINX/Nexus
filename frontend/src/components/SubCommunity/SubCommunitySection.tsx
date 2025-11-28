import { FC, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Grid } from '@mui/material';
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

export const SubCommunitySection: FC<SubCommunitySectionProps> = ({
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
