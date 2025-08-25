import React, { useState, useEffect } from 'react';
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

  const loadComments = React.useCallback(
    async (page: number = 1) => {
      try {
        const result = await getCommentsForPost(postId, page, 10);
        setComments(result.comments);
        setPagination(result.pagination);

        // Initialize vote states
        const votesState: Record<string, { isLiked: boolean; count: number }> =
          {};
        result.comments.forEach((comment) => {
          votesState[comment.id] = {
            isLiked:
              comment.Vote?.some(
                (vote) =>
                  vote.userId === currentUser?.id && vote.type === 'UPVOTE'
              ) || false,
            count: comment.Vote?.length || 0,
          };
        });
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

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentCommentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              }
            : comment
        )
      );

      setReplyContent('');
      setReplyingToCommentId(null);
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

      setCommentVotes((prev) => ({
        ...prev,
        [commentId]: {
          isLiked: newIsLiked,
          count: newIsLiked
            ? currentVoteState.count + 1
            : currentVoteState.count - 1,
        },
      }));

      await voteOnComment(
        commentId,
        newIsLiked ? VoteType.UPVOTE : VoteType.DOWNVOTE
      );
    } catch (error) {
      console.error('Error voting on comment:', error);
      // Revert UI state on error
      const currentVoteState = commentVotes[commentId] || {
        isLiked: false,
        count: 0,
      };
      setCommentVotes((prev) => ({
        ...prev,
        [commentId]: {
          isLiked: !currentVoteState.isLiked,
          count: currentVoteState.count,
        },
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
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const isAuthor = (comment: Comment) => {
    const commentUserId = comment.user?.id;
    return commentUserId && commentUserId === currentUser?.id;
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
      <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
        {/* Vote button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleCommentVote(comment.id);
          }}
          disabled={!token}
          color={voteState.isLiked ? 'error' : 'default'}
        >
          {voteState.isLiked ? (
            <Favorite fontSize="small" />
          ) : (
            <FavoriteBorder fontSize="small" />
          )}
        </IconButton>
        <Typography variant="body2" fontSize="0.8rem">
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
      </Box>
    );
  };

  const renderEditForm = () => (
    <Paper
      elevation={2}
      sx={{ p: 1.5, mt: 1, bgcolor: 'grey.50' }}
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
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            cancelEditing();
          }}
          startIcon={<Close />}
        >
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={(e) => {
            e.stopPropagation();
            setEditDialogOpen(true);
          }}
          startIcon={<Check />}
          disabled={!editingContent.trim()}
        >
          Save Changes
        </Button>
      </Box>
    </Paper>
  );

  const renderReplyForm = (parentComment: Comment) => (
    <Paper
      elevation={2}
      sx={{ p: 1.5, mt: 1, ml: 6, bgcolor: 'grey.50' }}
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
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            cancelReplying();
          }}
          startIcon={<Close />}
        >
          Cancel
        </Button>
        <Button
          size="small"
          variant="contained"
          onClick={(e) => {
            e.stopPropagation();
            handleReplySubmit(parentComment.id);
          }}
          startIcon={<Check />}
          disabled={!replyContent.trim()}
        >
          Reply
        </Button>
      </Box>
    </Paper>
  );

  const renderReplies = (comment: Comment) => {
    const replies = comment.replies || [];
    const isExpanded = expandedReplies.has(comment.id);

    if (replies.length === 0) return null;

    return (
      <Box sx={{ ml: 6 }}>
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            toggleReplies(comment.id);
          }}
          sx={{ mb: 1 }}
          startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
        >
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </Button>

        <Collapse in={isExpanded}>
          {replies.map((reply) => (
            <Box key={reply.id} sx={{ mb: 2 }}>
              <ListItem alignItems="flex-start" sx={{ pl: 0 }}>
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar
                    src={getAvatarUrl(reply)}
                    sx={{ width: 32, height: 32 }}
                    alt={getUserName(reply)}
                  >
                    {getAvatarFallback(reply)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="subtitle2" fontSize="0.9rem">
                        {getUserName(reply)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        fontSize="0.9rem"
                      >
                        {reply.content}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(reply.createdAt), {
                          addSuffix: true,
                        })}
                      </Typography>
                      {renderCommentActions(reply)}
                    </>
                  }
                />
              </ListItem>
              {replyingToCommentId === reply.id && renderReplyForm(reply)}
            </Box>
          ))}
        </Collapse>
      </Box>
    );
  };

  const renderLoginPrompt = () => (
    <Paper elevation={1} sx={{ p: 2, mb: 2, textAlign: 'center' }}>
      <Typography variant="body1" sx={{ mb: 2 }}>
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
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Main comment input - Only show if authenticated */}
      {token ? (
        <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
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
      <List sx={{ mt: 2 }}>
        {comments.map((comment) => (
          <Box key={comment.id} sx={{ mb: 2 }}>
            <ListItem alignItems="flex-start" sx={{ pl: 0 }}>
              <ListItemAvatar>
                <Avatar src={getAvatarUrl(comment)} alt={getUserName(comment)}>
                  {getAvatarFallback(comment)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="subtitle2">
                      {getUserName(comment)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <>
                    {editingCommentId === comment.id ? (
                      renderEditForm()
                    ) : (
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          {comment.content}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </Typography>
                        {renderCommentActions(comment)}
                      </>
                    )}
                  </>
                }
              />
            </ListItem>

            {/* Reply form for this comment */}
            {replyingToCommentId === comment.id && renderReplyForm(comment)}

            {/* Nested replies */}
            {renderReplies(comment)}

            <Divider sx={{ my: 2 }} />
          </Box>
        ))}
      </List>

      {/* Edit Confirmation Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={cancelEditing}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Edit</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to update this comment?</Typography>
          <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="primary.main" sx={{ mt: 1 }}>
              New: {editingContent}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelEditing}>Cancel</Button>
          <Button onClick={handleEditComment} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this comment?</Typography>
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
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick();
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick();
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {pagination.hasNext && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => loadComments(pagination.page + 1)}
            disabled={loading}
          >
            Load More Comments
          </Button>
        </Box>
      )}
    </Box>
  );
};
