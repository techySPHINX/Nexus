import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Grid } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { SubCommunityCard } from './SubCommunityCard';
import { useSubCommunity } from '../../contexts/SubCommunityContext';
import { SubCommunity, SubCommunityType } from '../../types/subCommunity';

interface SubCommunitySectionProps {
  title: string;
  type: string;
  initialCount?: number;
}

export const SubCommunitySection: React.FC<SubCommunitySectionProps> = ({
  title,
  type,
  initialCount = 6,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const {
    subCommunities,
    subCommunitiesByType,
    subCommunityCache,
    getSubCommunityByType,
    loading,
  } = useSubCommunity();

  // Get communities for this section
  const getCommunities = (): SubCommunity[] => {
    if (type === 'all') {
      return subCommunities;
    }

    let communities: SubCommunity[] = [];
    const cacheKey = `${type}-${currentPage}-20`;
    const cachedData = subCommunityCache[cacheKey];

    if (cachedData) {
      // Extract SubCommunity objects from the cached response
      communities = cachedData.data.flatMap(
        (typeGroup: SubCommunityType) => typeGroup.SubCommunity
      );
    } else {
      // Use the subCommunitiesByType array (which contains SubCommunity objects)
      communities = subCommunitiesByType;
    }

    return communities;
  };

  const communities = getCommunities();
  const displayedCommunities = showAll
    ? communities
    : communities.slice(0, initialCount);

  // Check if there are more communities to load
  const cacheKey = `${type}-${currentPage}-20`;
  const cachedData = subCommunityCache[cacheKey];
  const hasMore =
    communities.length > initialCount || cachedData?.pagination?.hasNext;

  const handleShowMore = async () => {
    if (showAll) {
      setShowAll(false);
      return;
    }

    if (type !== 'all') {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      try {
        await getSubCommunityByType(type, nextPage, 20);
        console.log('Fetched more sub-communities:', communities);
        setCurrentPage(nextPage);
      } catch (error) {
        console.error('Failed to load more communities:', error);
      } finally {
        setIsLoadingMore(false);
      }
    }

    setShowAll(true);
  };

  if (communities.length === 0 && !loading) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ fontWeight: 600, color: 'text.primary', mb: 3 }}
      >
        {title}
      </Typography>

      {loading && communities.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {displayedCommunities.map((subCom) => (
              <Grid item xs={12} sm={6} md={6} key={subCom.id}>
                <SubCommunityCard subCommunity={subCom} />
              </Grid>
            ))}
          </Grid>

          {hasMore && (
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
                disabled={isLoadingMore || loading}
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
        </>
      )}
    </Box>
  );
};
