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
  Tooltip,
} from '@mui/material';
import ReportButton from '../Report/ReportButton';
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
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import { useNotification } from '@/contexts/NotificationContext';

interface PostProps {
  post: PostType;
  onUpdate?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isAdminView?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onClick?: () => void;
}

export const Post: React.FC<PostProps> = ({
  post,
  onUpdate,
  onDelete,
  showActions = true,
  isAdminView = false,
  onApprove,
  onReject,
  onClick,
}) => {
  const { user, token } = useAuth();
  const { showNotification } = useNotification();
  const {
    approvePost,
    rejectPost,
    deletePost: deletePostContext,
    updatePost: updatePostContext,
  } = usePosts();
  const { voteOnPost, loading: engagementLoading } = useEngagement();
  const navigate = useNavigate();

  const isPostPage = window.location.pathname === `/posts/${post.id}`;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post?.content || '');
  const [editedSubject, setEditedSubject] = useState(post?.subject || '');
  const [isLiked, setIsLiked] = useState(
    (post.Vote || []).some((vote) => vote.type === VoteType.UPVOTE)
  );
  const [likeCount, setLikeCount] = useState(post?._count?.Vote || 0);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    setEditedSubject(post.subject || '');
    setEditedContent(post.content || '');
    setImagePreview(post.imageUrl);
    setIsEditing(true);
    handleMenuClose();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(post.content);
    setEditedSubject(post.subject || '');
    setImagePreview(post.imageUrl);
  };

  const handleSaveEdit = async () => {
    try {
      await updatePostContext(
        post.id,
        editedSubject,
        editedContent,
        imagePreview || undefined
      );

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
      // store preview only; we'll send the preview string to update
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApproveClick = () => {
    if (onApprove) {
      onApprove();
    } else {
      // Fallback to context function if onApprove not provided
      approvePost(post.id)
        .then(() => {
          if (onDelete) onDelete();
          setSnackbar({
            open: true,
            message: 'Post approved successfully',
            severity: 'success',
          });
        })
        .catch((error) => {
          console.error('Error approving post:', error);
          setSnackbar({
            open: true,
            message: 'Failed to approve post',
            severity: 'error',
          });
        });
    }
  };

  const handleRejectClick = () => {
    if (onReject) {
      onReject();
    } else {
      // Fallback to context function if onReject not provided
      rejectPost(post.id)
        .then(() => {
          if (onDelete) onDelete();
          setSnackbar({
            open: true,
            message: 'Post rejected successfully',
            severity: 'success',
          });
        })
        .catch((error) => {
          console.error('Error rejecting post:', error);
          setSnackbar({
            open: true,
            message: 'Failed to reject post',
            severity: 'error',
          });
        });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
  };

  const handleContentClick = () => {
    if (onClick) {
      onClick(); // Use the provided onClick handler if available
    } else {
      navigate(`/posts/${post.id}`); // Fallback to default behavior
    }
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={post.author.profile?.avatarUrl}
                sx={{ bgcolor: 'primary.light', cursor: 'pointer' }}
              >
                {post.author.name?.charAt(0) || 'N'}
              </Avatar>
              {/* Thumbnail only on the post detail page */}
              {/* {isPostPage && post.imageUrl && (
                <Box
                  component="img"
                  src={post.imageUrl}
                  alt="Post thumbnail"
                  sx={{
                    width: { xs: 40, sm: 56 },
                    height: { xs: 40, sm: 56 },
                    objectFit: 'cover',
                    borderRadius: 1,
                    display: 'block',
                  }}
                />
              )} */}
            </Box>
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
                {(isAuthor || isAdmin) && (
                  <>
                    <MenuItem onClick={handleEdit}>
                      <Edit sx={{ mr: 1 }} /> Edit
                    </MenuItem>
                    <MenuItem onClick={handleConfirmDelete}>
                      <Delete sx={{ mr: 1 }} /> Delete
                    </MenuItem>
                  </>
                )}
                {isAdminView && isAdmin && (
                  <>
                    <MenuItem onClick={handleApproveClick}>
                      <Check sx={{ mr: 1 }} /> Approve
                    </MenuItem>
                    <MenuItem onClick={handleRejectClick}>
                      <Close sx={{ mr: 1 }} /> Reject
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          )
        }
        title={
          <ProfileNameLink
            user={{
              id: post.author.id,
              name: post.author.name,
              role: post.author.role ?? 'STUDENT',
              profile: post.author.profile,
            }}
            showRoleBadge={
              window.location.pathname !== `/users/${user?.id}/posts` &&
              window.location.pathname !== `/profile` &&
              window.location.pathname !== `/profile/${user?.id}` // hide role badge on own profile and posts page
            }
            showYouBadge={
              window.location.pathname !== `/profile` &&
              window.location.pathname !== `/users/${user?.id}/posts` &&
              window.location.pathname !== `/profile/${user?.id}` // hide "You" badge on own profile and posts page
            }
            linkToProfile={window.location.pathname === `/posts/${post.id}`}
            variant="h6"
            fontSize="1.35rem"
          />
        }
        subheader={
          <>
            {post.type && (
              <>
                {' '}
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ display: 'inline', mr: 1 }}
                >
                  #{post.type}
                </Typography>
              </>
            )}
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
            {/* Show preview above inputs when editing on the post page */}
            {isPostPage && imagePreview && (
              <Box sx={{ mb: 2 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    display: 'block',
                  }}
                />
              </Box>
            )}
            <TextField
              fullWidth
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              sx={{ mb: 2 }}
              label="Subject"
            />
            <TextField
              fullWidth
              multiline
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              sx={{ mb: 2 }}
              label="Content"
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
            <Box
              onClick={
                window.location.pathname !== `/posts/${post.id}`
                  ? handleContentClick
                  : undefined
              }
              sx={{
                ...(window.location.pathname !== `/posts/${post.id}`
                  ? { cursor: 'pointer' }
                  : { cursor: 'default' }), // disables pointer when on post page
              }}
            >
              {/* Subject (Title) - Always visible */}
              {post.subject && (
                <Typography
                  variant={
                    window.location.pathname === `/posts/${post.id}`
                      ? 'h5'
                      : 'h6'
                  }
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    ...(window.location.pathname !== `/posts/${post.id}` && {
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }),
                  }}
                >
                  {/* for preserving line breaks */}
                  {post.subject.split('\n').map((line, idx) => (
                    <span key={idx}>
                      {line}
                      <br />
                    </span>
                  ))}
                </Typography>
              )}

              {/* Content - With truncation on list pages */}
              {post.content &&
                window.location.pathname === `/posts/${post.id}` && (
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1,
                      whiteSpace: 'pre-line',
                      ...(window.location.pathname !== `/posts/${post.id}` && {
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        fontSize: '1rem',
                        '&:hover': { color: 'primary.main' },
                      }),
                    }}
                  >
                    {post.content.split('\n').map((line, idx) => (
                      <span key={idx}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </Typography>
                )}

              {isPostPage && post.imageUrl && (
                <PostImage imageUrl={post.imageUrl} />
              )}
            </Box>
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

          <IconButton onClick={handleContentClick}>
            <CommentIcon />
          </IconButton>
          <Typography variant="body2">{post?._count?.Comment || 0}</Typography>

          <IconButton
            onClick={() => {
              return navigator.clipboard
                .writeText(`${window.location.origin}/posts/${post.id}`)
                .then(() =>
                  showNotification?.('Post URL copied to clipboard', 'success')
                )
                .catch(() =>
                  showNotification?.('Failed to copy post URL', 'error')
                );
            }}
          >
            <Tooltip title="Share Post">
              <Share />
            </Tooltip>
          </IconButton>
          <ReportButton type="POST" postId={post.id} />
        </CardActions>
      )}

      <Dialog open={confirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this post?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
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
