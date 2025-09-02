import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEngagement } from '../../contexts/engagementContext';
import {
  Box,
  TextField,
  Button,
  Avatar,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Collapse,
  Paper,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import {
  Edit,
  Reply,
  Close,
  Check,
  MoreVert,
  Delete,
  ExpandMore,
  ExpandLess,
  Favorite,
  FavoriteBorder,
  SubdirectoryArrowRight,
} from '@mui/icons-material';
import { Comment } from '@/types/engagement';
import { useNavigate } from 'react-router-dom';
import { VoteType } from '@/types/engagement';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  onCommentAdded,
}) => {
  const theme = useTheme();
  const { user: currentUser, token } = useAuth();
  const {
    commentOnPost,
    getCommentsForPost,
    updateComment,
    deleteComment,
    voteOnComment,
    loading,
    error,
    clearError,
  } = useEngagement();
  const navigate = useNavigate();

  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(
    null
  );
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  const [commentVotes, setCommentVotes] = useState<
    Record<string, { isLiked: boolean; count: number }>
  >({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Menu and dialog states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Load comments for this post
  const loadComments = useCallback(
    async (page: number = 1) => {
      try {
        const result = await getCommentsForPost(postId, page, 10);
        const commentsData = result.comments || [];

        if (page === 1) {
          setComments(commentsData);
        } else {
          setComments((prev) => [...prev, ...commentsData]);
        }

        setPagination(
          result.pagination || {
            page,
            limit: 10,
            total: commentsData.length,
            totalPages: Math.ceil(commentsData.length / 10),
            hasNext: false,
            hasPrev: false,
          }
        );

        // Initialize vote states
        const votesState: Record<string, { isLiked: boolean; count: number }> =
          {};
        const processComments = (commentList: Comment[]) => {
          commentList.forEach((comment) => {
            votesState[comment.id] = {
              isLiked:
                comment.votes?.some(
                  (vote) =>
                    vote.userId === currentUser?.id && vote.type === 'UPVOTE'
                ) || false,
              count: comment.votes?.length || 0,
            };

            if (comment.replies && comment.replies.length > 0) {
              processComments(comment.replies);
            }
          });
        };

        processComments(commentsData);
        setCommentVotes(votesState);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    },
    [getCommentsForPost, postId, currentUser?.id]
  );

  useEffect(() => {
    loadComments();
  }, [postId, loadComments]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    comment: Comment
  ) => {
    if (!token) {
      navigate('/login');
      return;
    }
    setAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedComment(null);
  };

  const handleEditClick = () => {
    if (selectedComment) {
      setEditingCommentId(selectedComment.id);
      setEditingContent(selectedComment.content);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleCommentSubmit = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!comment.trim()) return;

    try {
      const newComment = await commentOnPost(postId, comment.trim());
      setComments((prev) => [newComment, ...prev]);
      setComment('');
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleReplySubmit = async (parentCommentId: string) => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!replyContent.trim()) return;

    try {
      const newReply = await commentOnPost(
        postId,
        replyContent.trim(),
        parentCommentId
      );

      // Update the comments state with the new reply
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply],
            };
          }
          return comment;
        })
      );

      // Also update vote state for the new reply
      setCommentVotes((prev) => ({
        ...prev,
        [newReply.id]: {
          isLiked: false,
          count: 0,
        },
      }));

      setReplyContent('');
      setReplyingToCommentId(null);

      // Auto-expand replies if not already expanded
      if (!expandedReplies.has(parentCommentId)) {
        setExpandedReplies((prev) => new Set(prev).add(parentCommentId));
      }

      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleEditComment = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!editingContent.trim() || !editingCommentId) return;

    try {
      const updatedComment = await updateComment(
        editingCommentId,
        editingContent.trim()
      );
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === editingCommentId ? updatedComment : comment
        )
      );
      setEditingCommentId(null);
      setEditingContent('');
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!selectedComment) return;

    try {
      await deleteComment(selectedComment.id);
      setComments((prev) =>
        prev.filter((comment) => comment.id !== selectedComment.id)
      );
      setDeleteDialogOpen(false);
      setSelectedComment(null);
      if (onCommentAdded) onCommentAdded();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleCommentVote = async (commentId: string) => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const currentVoteState = commentVotes[commentId] || {
        isLiked: false,
        count: 0,
      };
      const newIsLiked = !currentVoteState.isLiked;

      // Optimistic UI update
      setCommentVotes((prev) => ({
        ...prev,
        [commentId]: {
          isLiked: newIsLiked,
          count: newIsLiked
            ? currentVoteState.count + 1
            : Math.max(0, currentVoteState.count - 1),
        },
      }));

      const voteType = newIsLiked ? VoteType.UPVOTE : VoteType.DOWNVOTE;

      await voteOnComment(commentId, voteType);
    } catch (error) {
      console.error('Error voting on comment:', error);
      // Revert UI state on error
      const currentVoteState = commentVotes[commentId] || {
        isLiked: false,
        count: 0,
      };
      setCommentVotes((prev) => ({
        ...prev,
        [commentId]: currentVoteState,
      }));
    }
  };

  const startReplying = (commentId: string) => {
    if (!token) {
      navigate('/login');
      return;
    }
    setReplyingToCommentId(commentId);
    setEditingCommentId(null);
    setReplyContent('');
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingContent('');
    setEditDialogOpen(false);
  };

  const cancelReplying = () => {
    setReplyingToCommentId(null);
    setReplyContent('');
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(commentId)) {
        newExpanded.delete(commentId);
      } else {
        newExpanded.add(commentId);
      }
      return newExpanded;
    });
  };

  const isAuthor = (comment: Comment) => {
    return comment.user?.id === currentUser?.id;
  };

  const getUserName = (comment: Comment) => {
    return comment.user?.name || comment.user?.email || 'Unknown User';
  };

  const getAvatarUrl = (comment: Comment) => {
    return comment.user?.profile?.avatarUrl;
  };

  const getAvatarFallback = (comment: Comment) => {
    const name = getUserName(comment);
    return name.charAt(0).toUpperCase();
  };

  const renderCommentActions = (comment: Comment) => {
    const voteState = commentVotes[comment.id] || { isLiked: false, count: 0 };

    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
        {/* Vote button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleCommentVote(comment.id);
          }}
          disabled={!token}
          color={voteState.isLiked ? 'error' : 'default'}
          sx={{
            color: voteState.isLiked
              ? theme.palette.error.main
              : theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          {voteState.isLiked ? (
            <Favorite fontSize="small" />
          ) : (
            <FavoriteBorder fontSize="small" />
          )}
        </IconButton>
        <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
          {voteState.count}
        </Typography>

        {/* Reply button */}
        <Chip
          label="Reply"
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            startReplying(comment.id);
          }}
          icon={<Reply fontSize="small" />}
          disabled={!token}
          sx={{
            borderRadius: 2,
            height: 24,
            '& .MuiChip-icon': { fontSize: 14 },
          }}
        />

        {/* Edit/Delete menu */}
        {isAuthor(comment) && token && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuOpen(e, comment);
            }}
            sx={{ ml: 0.5 }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        )}
      </Stack>
    );
  };

  const renderEditForm = () => (
    <Paper
      elevation={1}
      sx={{ p: 1.5, mt: 1, bgcolor: alpha(theme.palette.primary.main, 0.05) }}
      onClick={(e) => e.stopPropagation()}
    >
      <TextField
        fullWidth
        multiline
        rows={3}
        value={editingContent}
        onChange={(e) => setEditingContent(e.target.value)}
        variant="outlined"
        size="small"
        sx={{ mb: 1 }}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          size="small"
          variant="outlined"
          onClick={cancelEditing}
          startIcon={<Close />}
        >
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={handleEditComment}
          startIcon={<Check />}
          disabled={!editingContent.trim()}
        >
          Save
        </Button>
      </Stack>
    </Paper>
  );

  const renderReplyForm = (parentComment: Comment) => (
    <Paper
      elevation={1}
      sx={{
        p: 1.5,
        mt: 1,
        ml: { xs: 2, sm: 4 },
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        borderLeft: `3px solid ${theme.palette.primary.main}`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 1, display: 'block' }}
      >
        Replying to {getUserName(parentComment)}
      </Typography>
      <TextField
        fullWidth
        multiline
        rows={2}
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="Write your reply..."
        variant="outlined"
        size="small"
        sx={{ mb: 1 }}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          size="small"
          variant="outlined"
          onClick={cancelReplying}
          startIcon={<Close />}
        >
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={() => handleReplySubmit(parentComment.id)}
          startIcon={<Check />}
          disabled={!replyContent.trim()}
        >
          Reply
        </Button>
      </Stack>
    </Paper>
  );

  const renderComment = (
    comment: Comment,
    depth: number = 0,
    isReply: boolean = false
  ) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const replyCount = comment.replies?.length || 0;
    const isExpanded = expandedReplies.has(comment.id);
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToCommentId === comment.id;

    return (
      <Box key={comment.id} sx={{ mb: 2 }}>
        <ListItem
          alignItems="flex-start"
          sx={{
            pl: 0,
            ml: depth > 0 ? { xs: 2, sm: 4 } : 0,
            position: 'relative',
          }}
        >
          {depth > 0 && (
            <SubdirectoryArrowRight
              sx={{
                position: 'absolute',
                left: -20,
                top: 16,
                color: 'text.secondary',
                fontSize: 16,
              }}
            />
          )}

          <ListItemAvatar sx={{ minWidth: 40 }}>
            <Avatar
              src={getAvatarUrl(comment)}
              sx={{ width: 32, height: 32 }}
              alt={getUserName(comment)}
            >
              {getAvatarFallback(comment)}
            </Avatar>
          </ListItemAvatar>

          <ListItemText
            primary={
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                component="span"
              >
                <Typography
                  variant="subtitle2"
                  fontSize="0.9rem"
                  fontWeight="600"
                >
                  {getUserName(comment)}
                </Typography>
                {isAuthor(comment) && (
                  <Chip
                    label="You"
                    size="small"
                    variant="filled"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  component="span"
                >
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </Typography>
              </Stack>
            }
            secondary={
              <Box sx={{ mt: 0.5 }}>
                {isEditing ? (
                  renderEditForm()
                ) : (
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ display: 'block', mb: 0.5, lineHeight: 1.4 }}
                    >
                      {comment.content}
                    </Typography>
                    {renderCommentActions(comment)}
                  </>
                )}
              </Box>
            }
            sx={{
              '& .MuiListItemText-primary': { mb: 0.5 },
              '& .MuiListItemText-secondary': { mt: 0 },
            }}
          />
        </ListItem>

        {/* Reply form for this comment */}
        {isReplying && renderReplyForm(comment)}

        {/* Replies section */}
        {hasReplies && (
          <Box sx={{ ml: { xs: 2, sm: 4 } }}>
            <Button
              size="small"
              onClick={() => toggleReplies(comment.id)}
              sx={{
                mb: 1,
                color: 'primary',
                fontSize: '0.8rem',
              }}
              startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
            >
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </Button>

            <Collapse in={isExpanded}>
              <Stack spacing={2} sx={{ mt: 1 }}>
                {comment.replies?.map((reply) =>
                  renderComment(reply, depth + 1, true)
                )}
              </Stack>
            </Collapse>
          </Box>
        )}

        {!isReply && depth === 0 && <Divider sx={{ my: 2 }} />}
      </Box>
    );
  };

  const renderLoginPrompt = () => (
    <Paper elevation={1} sx={{ p: 3, mb: 2, textAlign: 'center' }}>
      <Typography variant="body1" sx={{ mb: 2 }} color="text.secondary">
        Please login to comment and engage with this post
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/login')}
        size="medium"
      >
        Login to Comment
      </Button>
    </Paper>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Main comment input */}
      {token ? (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Add a comment
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts..."
            variant="outlined"
            sx={{ mb: 2 }}
            disabled={loading}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleCommentSubmit}
              disabled={!comment.trim() || loading}
              size="medium"
            >
              {loading ? <CircularProgress size={20} /> : 'Post Comment'}
            </Button>
          </Box>
        </Paper>
      ) : (
        renderLoginPrompt()
      )}

      {/* Comments list */}
      {comments.length > 0 ? (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }} component="span">
            Comments ({pagination.total})
          </Typography>
          <List sx={{ mt: 1 }}>
            {comments.map((comment) => renderComment(comment))}
          </List>
        </Box>
      ) : (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" component="span">
            No comments yet. Be the first to comment!
          </Typography>
        </Paper>
      )}

      {/* Dialogs */}
      <Dialog
        open={editDialogOpen}
        onClose={cancelEditing}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelEditing}>Cancel</Button>
          <Button
            onClick={handleEditComment}
            variant="contained"
            disabled={!editingContent.trim()}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Comment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this comment? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteComment}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* More Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEditClick}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Load more button */}
      {pagination.hasNext && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={() => loadComments(pagination.page + 1)}
            disabled={loading}
            startIcon={loading && <CircularProgress size={16} />}
          >
            {loading ? 'Loading...' : 'Load More Comments'}
          </Button>
        </Box>
      )}
    </Box>
  );
};
