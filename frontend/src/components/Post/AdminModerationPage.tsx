import React, { useEffect, useState } from 'react';
import { usePosts } from '../../contexts/PostContext';
import { Post } from '../../pages/Post';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';

export const AdminModerationPage: React.FC = () => {
  const { 
    pendingPosts, 
    getPendingPosts, 
    pagination, 
    loading,
    approvePost,
    rejectPost
  } = usePosts();
  
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    getPendingPosts();
  }, [getPendingPosts]);

  const handleLoadMore = () => {
    getPendingPosts(pagination.page + 1);
  };

  const handleApprove = (postId: string) => {
    setSelectedPostId(postId);
    setActionType('approve');
  };

  const handleReject = (postId: string) => {
    setSelectedPostId(postId);
    setActionType('reject');
  };

  const handleConfirmAction = async () => {
    if (!selectedPostId || !actionType) return;

    try {
      if (actionType === 'approve') {
        await approvePost(selectedPostId);
        setSnackbarMessage('Post approved successfully!');
        setSnackbarSeverity('success');
      } else {
        await rejectPost(selectedPostId);
        setSnackbarMessage('Post rejected successfully!');
        setSnackbarSeverity('success');
      }
      setSnackbarOpen(true);
      // Refresh the list after action
      getPendingPosts(1); // Reset to first page
    } catch (error) {
      setSnackbarMessage('Failed to process post. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSelectedPostId(null);
      setActionType(null);
    }
  };

  const handleCancelAction = () => {
    setSelectedPostId(null);
    setActionType(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Post Moderation
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Review and approve or reject pending posts
      </Typography>
      
      {loading && pagination.page === 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : pendingPosts.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No pending posts to moderate.
        </Typography>
      ) : (
        <>
          {pendingPosts.map((post) => (
            <Post 
              key={post.id} 
              post={post} 
              isAdminView ={true}
              showActions={true}
              onApprove={() => handleApprove(post.id)}
              onReject={() => handleReject(post.id)}
            />
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

      {/* Confirmation Dialog */}
      <Dialog open={!!actionType} onClose={handleCancelAction}>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Post' : 'Reject Post'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {actionType} this post?
          </Typography>
          {actionType === 'reject' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction}>Cancel</Button>
          <Button 
            onClick={handleConfirmAction} 
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            {actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};