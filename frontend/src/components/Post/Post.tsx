import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../contexts/PostContext';
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
} from '@mui/material';
import {
  MoreVert,
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  Edit,
  Delete,
  Check,
  Close,
} from '@mui/icons-material';
import { PostImage } from './PostImage';
import { CommentSection } from './CommentSection';
import { SubCommunityBadge } from './SubCommunityBadge';
import { Link } from 'react-router-dom';
import { Post as PostType } from '../../types/post'; // Import your Post type

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
  const { user } = useAuth();
  const {
    approvePost,
    rejectPost,
    deletePost: deletePostContext,
    updatePost: updatePostContext,
  } = usePosts();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post?.content || '');
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?._count?.Vote || 0); // Change to Vote
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    post?.imageUrl
  );

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
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePostContext(post.id);
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setConfirmOpen(false);
    }
  };

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
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
    } catch (error) {
      console.error('Error approving post:', error);
    }
  };

  const handleReject = async () => {
    try {
      await rejectPost(post.id);
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error rejecting post:', error);
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
          <Link to={'/profile'} style={{ textDecoration: 'none' }}>
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
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<Check />}
                      onClick={handleApprove}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Close />}
                      onClick={handleReject}
                    >
                      Reject
                    </Button>
                  </Box>
                )}
              </Menu>
            </>
          )
        }
        title={post.author.name}
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
            <Typography variant="body1" sx={{ mb: 2 }}>
              {post.content}
            </Typography>
            {post.imageUrl && <PostImage imageUrl={post.imageUrl} />}
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
          <IconButton onClick={handleLike}>
            {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
          </IconButton>
          <Typography variant="body2">{likeCount}</Typography>
          <IconButton onClick={() => setShowComments(!showComments)}>
            <Comment />
          </IconButton>
          <Typography variant="body2">{post?._count?.Comment || 0}</Typography>
          <IconButton>
            <Share />
          </IconButton>
        </CardActions>
      )}

      {showComments && <CommentSection postId={post.id} />}

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
    </Card>
  );
};
