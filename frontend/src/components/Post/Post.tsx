import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../contexts/PostContext';
import { useEngagement } from '../../contexts/engagementContext';
import { formatDistanceToNow } from 'date-fns';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  MoreVert,
  Favorite,
  FavoriteBorder,
  Comment as CommentIcon,
  Share,
  Edit,
  Delete,
  Check,
  Close,
} from '@mui/icons-material';
import { PostImage } from './PostImage';
import { SubCommunityBadge } from './SubCommunityBadge';
import { Link, useNavigate } from 'react-router-dom';
import { Post as PostType } from '@/types/post';
import { VoteType } from '@/types/engagement';

interface PostProps {
  post: PostType;
  onUpdate?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isAdminView?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

export const Post: React.FC<PostProps> = ({
  post,
  onUpdate,
  onDelete,
  showActions = true,
  isAdminView = false,
}) => {
  const { user, token } = useAuth();
  const {
    approvePost,
    rejectPost,
    deletePost: deletePostContext,
    updatePost: updatePostContext,
  } = usePosts();
  const { voteOnPost, loading: engagementLoading } = useEngagement();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post?.content || '');
  const [isLiked, setIsLiked] = useState(
    post.Vote?.some(
      (vote) => vote.userId === user?.id && vote.type === 'UPVOTE'
    ) || false
  );

  const [likeCount, setLikeCount] = useState(
    post.Vote?.length || post?._count?.Vote || 0
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    post?.imageUrl
  );
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(post.content);
    setImagePreview(post.imageUrl);
    setImageFile(null);
  };

  const handleSaveEdit = async () => {
    try {
      await updatePostContext(post.id, editedContent, imageFile || undefined);
      setIsEditing(false);
      if (onUpdate) onUpdate();
      setSnackbar({
        open: true,
        message: 'Post updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating post:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update post',
        severity: 'error',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePostContext(post.id);
      if (onDelete) onDelete();
      setSnackbar({
        open: true,
        message: 'Post deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete post',
        severity: 'error',
      });
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleLike = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikeCount(newIsLiked ? likeCount + 1 : likeCount - 1);

      await voteOnPost(
        post.id,
        newIsLiked ? VoteType.UPVOTE : VoteType.DOWNVOTE
      );
    } catch (error) {
      console.error('Error voting on post:', error);
      // Revert UI state on error
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
      setSnackbar({
        open: true,
        message: 'Failed to process vote',
        severity: 'error',
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApprove = async () => {
    try {
      await approvePost(post.id);
      if (onDelete) onDelete();
      setSnackbar({
        open: true,
        message: 'Post approved successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error approving post:', error);
      setSnackbar({
        open: true,
        message: 'Failed to approve post',
        severity: 'error',
      });
    }
  };

  const handleReject = async () => {
    try {
      await rejectPost(post.id);
      if (onDelete) onDelete();
      setSnackbar({
        open: true,
        message: 'Post rejected successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error rejecting post:', error);
      setSnackbar({
        open: true,
        message: 'Failed to reject post',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const isAuthor = user?.id === post.author.id;
  const isAdmin = user?.role === 'ADMIN';

  if (!post) {
    return (
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography color="error">Post data is missing or invalid</Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        avatar={
          <Link
            to={`/profile/${post.author.id}`}
            style={{ textDecoration: 'none' }}
          >
            <Avatar
              src={post.author.profile?.avatarUrl}
              sx={{ bgcolor: 'primary.light', cursor: 'pointer' }}
            >
              {post.author.name?.charAt(0) || 'N'}
            </Avatar>
          </Link>
        }
        action={
          showActions &&
          (isAuthor || isAdmin) && (
            <>
              <IconButton onClick={handleMenuOpen}>
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                {isAuthor && (
                  <>
                    <MenuItem onClick={handleEdit}>
                      <Edit sx={{ mr: 1 }} /> Edit
                    </MenuItem>
                    <MenuItem onClick={() => setConfirmOpen(true)}>
                      <Delete sx={{ mr: 1 }} /> Delete
                    </MenuItem>
                  </>
                )}
                {isAdminView && isAdmin && (
                  <>
                    <MenuItem onClick={handleApprove}>
                      <Check sx={{ mr: 1 }} /> Approve
                    </MenuItem>
                    <MenuItem onClick={handleReject}>
                      <Close sx={{ mr: 1 }} /> Reject
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          )
        }
        title={
          <Link
            to={`/profile/${post.author.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {post.author.name}
          </Link>
        }
        subheader={
          <>
            Posted{' '}
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            {post.updatedAt !== post.createdAt && (
              <>
                {' '}
                • Updated{' '}
                {formatDistanceToNow(new Date(post.updatedAt), {
                  addSuffix: true,
                })}
              </>
            )}
          </>
        }
      />

      {post.subCommunity && (
        <Box sx={{ px: 2 }}>
          <SubCommunityBadge subCommunity={post.subCommunity} />
        </Box>
      )}

      <CardContent>
        {isEditing ? (
          <>
            <TextField
              fullWidth
              multiline
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              sx={{ mb: 2 }}
            />
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id={`edit-image-${post.id}`}
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor={`edit-image-${post.id}`}>
              <Button variant="outlined" component="span" sx={{ mr: 2 }}>
                Change Image
              </Button>
            </label>
            {imagePreview && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '300px' }}
                />
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={handleCancelEdit} sx={{ mr: 2 }}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSaveEdit}>
                Save
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Link
              to={`/posts/${post.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Typography
                variant="body1"
                sx={{
                  mb: 2,
                  cursor: 'pointer',
                  '&:hover': {
                    color: 'green',
                  },
                }}
              >
                {post.content}
              </Typography>
            </Link>
            {post.imageUrl && (
              <Link to={`/posts/${post.id}`} style={{ textDecoration: 'none' }}>
                <PostImage imageUrl={post.imageUrl} />
              </Link>
            )}
            {isAdminView && post.status && (
              <Chip
                label={post.status}
                color={
                  post.status === 'APPROVED'
                    ? 'success'
                    : post.status === 'REJECTED'
                      ? 'error'
                      : 'warning'
                }
                size="small"
                sx={{ mt: 1 }}
              />
            )}
          </>
        )}
      </CardContent>

      {showActions && !isEditing && (
        <CardActions>
          <IconButton
            onClick={handleLike}
            disabled={engagementLoading || !token}
          >
            {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
          </IconButton>
          <Typography variant="body2">{likeCount}</Typography>
          <CommentIcon />
          <Typography variant="body2">{post?._count?.Comment || 0}</Typography>

          <IconButton>
            <Share />
          </IconButton>
        </CardActions>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this post?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};
