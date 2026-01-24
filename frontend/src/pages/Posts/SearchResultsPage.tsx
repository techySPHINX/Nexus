import { FC, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePosts } from '../../contexts/PostContext';
import { Post } from '../../components/Post/Post';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const SearchResultsPage: FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const subCommunityId = queryParams.get('subCommunityId') || undefined;

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const { searchResults, searchPosts, pagination, loading } = usePosts();

  useEffect(() => {
    if (initialQuery) {
      searchPosts(initialQuery, 1, 10, subCommunityId);
    }
  }, [initialQuery, subCommunityId, searchPosts]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchPosts(searchQuery, 1, 10, subCommunityId);
    }
  };

  const handleLoadMore = () => {
    searchPosts(searchQuery, pagination.page + 1, 10, subCommunityId);
  };

  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
            ),
          }}
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={!searchQuery.trim()}
        >
          Search
        </Button>
      </Box>

      {subCommunityId && (
        <Chip
          label={`Filtered by sub-community: ${subCommunityId}`}
          sx={{ mb: 2 }}
          onDelete={() => (window.location.href = `/search?q=${searchQuery}`)}
        />
      )}

      {loading && pagination.page === 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : searchResults.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No results found for &quot;{searchQuery}&quot;
        </Typography>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Search Results for &quot;{searchQuery}&quot;
          </Typography>

          {searchResults.map((post) => (
            <Post key={post.id} post={post} />
          ))}

          {pagination.hasNext && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Load More'}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default SearchResultsPage;
