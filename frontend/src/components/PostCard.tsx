import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Box,
  IconButton,
  Chip,
  Button,
  TextField,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  Comment,
  Share,
  MoreVert,
  Send,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userRole: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string, content: string) => void;
  onDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');

  const isLiked = user && post.likes.includes(user.id);
  const canDelete = user && (user.id === post.userId || user.role === 'ADMIN');

  const handleLike = () => {
    if (user) {
      onLike(post.id);
    }
  };

  const handleComment = () => {
    if (newComment.trim() && user) {
      onComment(post.id, newComment.trim());
      setNewComment('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function setAnchorEl(_currentTarget: EventTarget & HTMLButtonElement): void {
    throw new Error('Function not implemented.');
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ mb: 2, position: 'relative' }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {post.userName.charAt(0).toUpperCase()}
            </Avatar>
          }
          action={
            canDelete && (
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                size="small"
              >
                <MoreVert />
              </IconButton>
            )
          }
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {post.userName}
              </Typography>
              <Chip
                label={post.userRole}
                size="small"
                color={post.userRole === 'STUDENT' ? 'primary' : 'secondary'}
                variant="outlined"
              />
            </Box>
          }
          subheader={formatDate(post.createdAt)}
        />

        <CardContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {post.content}
          </Typography>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleLike}
              color={isLiked ? 'primary' : 'default'}
              size="small"
            >
              {isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {post.likes.length}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => setShowComments(!showComments)}
              size="small"
            >
              <Comment />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {post.comments.length}
            </Typography>
          </Box>

          <IconButton size="small">
            <Share />
          </IconButton>
        </CardActions>

        <Collapse in={showComments}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 2 }} />

            {post.comments.length > 0 && (
              <List dense>
                {post.comments.map((comment) => (
                  <ListItem key={comment.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
                      >
                        {comment.userName.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            {comment.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(comment.createdAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={comment.content}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleComment}
                disabled={!newComment.trim()}
              >
                <Send />
              </Button>
            </Box>
          </Box>
        </Collapse>
      </Card>
    </motion.div>
  );
};

export default PostCard;
