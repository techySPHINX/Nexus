import { CSSProperties, FC, useState } from 'react';
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
import { useTheme } from '@/contexts/ThemeContext';

interface PostProps {
  post: PostType;
  onUpdate?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  isAdminView?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onClick?: () => void;
  compactMode?: boolean;
}

export const Post: FC<PostProps> = ({
  post,
  onUpdate,
  onDelete,
  showActions = true,
  isAdminView = false,
  onApprove,
  onReject,
  onClick,
  compactMode = false,
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
  const { isDark } = useTheme();

  const isPostPage = window.location.pathname === `/posts/${post.id}`;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post?.content || '');
  const [editedSubject, setEditedSubject] = useState(post?.subject || '');
  const [isLiked, setIsLiked] = useState(!!post.hasVoted);
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
  const [expandedContent, setExpandedContent] = useState(false);

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

  const handleContentKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleContentClick();
    }
  };

  const isAuthor = user?.id === post.author.id;
  const isAdmin = user?.role === 'ADMIN';
  const isCompactCard = compactMode && !isPostPage;
  const postContentClass = isDark
    ? `text-neutral-300 ${isCompactCard ? 'text-[0.68rem]' : 'text-sm'} mb-2 leading-relaxed`
    : `text-gray-700 ${isCompactCard ? 'text-[0.68rem]' : 'text-sm'} mb-2 leading-relaxed`;

  if (!post) {
    return (
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography color="error">Post data is missing or invalid</Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: isCompactCard ? 1 : 3 }}>
      <CardHeader
        sx={{
          px: isCompactCard ? 1 : 2,
          py: isCompactCard ? 0.5 : 1,
          '& .MuiCardHeader-content': { minWidth: 0 },
          '& .MuiCardHeader-action': { m: 0 },
        }}
        avatar={
          <Link
            to={`/profile/${post.author.id}`}
            style={{ textDecoration: 'none' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={post.author.profile?.avatarUrl}
                sx={{
                  bgcolor: 'primary.light',
                  cursor: 'pointer',
                  width: isCompactCard ? 28 : 40,
                  height: isCompactCard ? 28 : 40,
                  fontSize: isCompactCard ? '0.72rem' : '1rem',
                }}
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
              <IconButton
                onClick={handleMenuOpen}
                aria-label="Open post actions"
                size={isCompactCard ? 'small' : 'medium'}
                sx={{
                  minWidth: isCompactCard ? 30 : 44,
                  minHeight: isCompactCard ? 30 : 44,
                }}
              >
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
            fontSize={isCompactCard ? '0.86rem' : '1.35rem'}
          />
        }
        subheader={
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              fontSize: isCompactCard ? '0.62rem' : undefined,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {post.type && (
              <>
                {' '}
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    display: 'inline',
                    mr: 1,
                    fontSize: isCompactCard ? '0.6rem' : undefined,
                  }}
                >
                  #{post.type}
                </Typography>
              </>
            )}
            Posted{' '}
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            {!isCompactCard && post.updatedAt !== post.createdAt && (
              <>
                {' '}
                • Updated{' '}
                {formatDistanceToNow(new Date(post.updatedAt), {
                  addSuffix: true,
                })}
              </>
            )}
          </Box>
        }
      />

      {post.subCommunity && (
        <Box sx={{ px: isCompactCard ? 1 : 2 }}>
          <SubCommunityBadge subCommunity={post.subCommunity} />
        </Box>
      )}

      <CardContent
        sx={{ px: isCompactCard ? 1 : 2, py: isCompactCard ? 0.75 : 2 }}
      >
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
              onKeyDown={
                window.location.pathname !== `/posts/${post.id}`
                  ? handleContentKeyDown
                  : undefined
              }
              role={
                window.location.pathname !== `/posts/${post.id}`
                  ? 'button'
                  : undefined
              }
              tabIndex={
                window.location.pathname !== `/posts/${post.id}` ? 0 : undefined
              }
              aria-label={
                window.location.pathname !== `/posts/${post.id}`
                  ? `Open post: ${post.subject || 'Post details'}`
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
                    mb: isCompactCard ? 0.5 : 1,
                    fontWeight: 600,
                    fontSize: isCompactCard ? '0.78rem' : undefined,
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

              {/* Content - full on post page; truncated with expand on list pages */}
              {post.content && (
                <>
                  {isPostPage ? (
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, whiteSpace: 'pre-line' }}
                    >
                      {post.content.split('\n').map((line, idx) => (
                        <span key={idx}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </Typography>
                  ) : (
                    <div>
                      <p
                        className={postContentClass}
                        style={
                          {
                            display: expandedContent ? 'block' : '-webkit-box',
                            WebkitLineClamp: expandedContent
                              ? 'unset'
                              : isCompactCard
                                ? 2
                                : 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: expandedContent ? 'visible' : 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: expandedContent ? 'pre-line' : 'normal',
                          } as CSSProperties
                        }
                      >
                        {post.content}
                      </p>

                      {/* Show more / less button */}
                      {post.content.length > 240 && (
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedContent((s) => !s);
                          }}
                          sx={{
                            textTransform: 'none',
                            mt: 0.5,
                            minWidth: 0,
                            px: 0.5,
                            fontSize: isCompactCard ? '0.62rem' : undefined,
                          }}
                        >
                          {expandedContent ? 'Show less' : 'Show more'}
                        </Button>
                      )}
                    </div>
                  )}
                </>
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
        <div className="flex justify-between">
          <CardActions
            sx={{
              px: isCompactCard ? 0.5 : 1,
              py: isCompactCard ? 0.25 : 1,
              gap: isCompactCard ? 0.25 : 0.5,
            }}
          >
            <IconButton
              onClick={handleLike}
              disabled={engagementLoading || !token}
              aria-label={isLiked ? 'Unlike post' : 'Like post'}
              size={isCompactCard ? 'small' : 'medium'}
              sx={{
                minWidth: isCompactCard ? 28 : 44,
                minHeight: isCompactCard ? 28 : 44,
              }}
            >
              {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
            <Typography
              variant="body2"
              sx={{ fontSize: isCompactCard ? '0.62rem' : undefined }}
            >
              {likeCount}
            </Typography>

            <IconButton
              onClick={handleContentClick}
              aria-label="Open comments"
              size={isCompactCard ? 'small' : 'medium'}
              sx={{
                minWidth: isCompactCard ? 28 : 44,
                minHeight: isCompactCard ? 28 : 44,
              }}
            >
              <CommentIcon />
            </IconButton>
            <Typography
              variant="body2"
              sx={{ fontSize: isCompactCard ? '0.62rem' : undefined }}
            >
              {post?._count?.Comment || 0}
            </Typography>

            <IconButton
              onClick={() => {
                return navigator.clipboard
                  .writeText(`${window.location.origin}/posts/${post.id}`)
                  .then(() =>
                    showNotification?.(
                      'Post URL copied to clipboard',
                      'success'
                    )
                  )
                  .catch(() =>
                    showNotification?.('Failed to copy post URL', 'error')
                  );
              }}
              aria-label="Copy post link"
              size={isCompactCard ? 'small' : 'medium'}
              sx={{
                minWidth: isCompactCard ? 28 : 44,
                minHeight: isCompactCard ? 28 : 44,
              }}
            >
              <Tooltip title="Share Post">
                <Share />
              </Tooltip>
            </IconButton>
            <ReportButton type="POST" postId={post.id} />
          </CardActions>
          <div>
            <Box sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
              <Tooltip title="Post score">
                <Chip
                  label={
                    typeof post.score === 'number' ? post.score : likeCount
                  }
                  color="primary"
                  size="small"
                  sx={{
                    fontWeight: 600,
                    height: isCompactCard ? 20 : undefined,
                    '& .MuiChip-label': {
                      fontSize: isCompactCard ? '0.58rem' : undefined,
                    },
                  }}
                />
              </Tooltip>
            </Box>
          </div>
        </div>
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
