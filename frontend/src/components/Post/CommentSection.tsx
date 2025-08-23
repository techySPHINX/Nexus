import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
// import { usePosts } from '../../contexts/PostContext';
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
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  postId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = () => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string | undefined;
      name: string | undefined;
      profile: {
        avatarUrl?: string;
      };
    };
  }

  const [comments, setComments] = useState<Comment[]>([]);

  const handleCommentSubmit = async () => {
    try {
      // Implement comment submission
      const newComment = {
        id: Date.now().toString(),
        content: comment,
        createdAt: new Date().toISOString(),
        user: {
          id: user?.id,
          name: user?.name,
          profile: {
            avatarUrl: user?.profile?.avatarUrl,
          },
        },
      };
      setComments((prev) => [newComment, ...prev]);
      setComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        multiline
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment..."
        variant="outlined"
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        onClick={handleCommentSubmit}
        disabled={!comment.trim()}
      >
        Post Comment
      </Button>

      <List sx={{ mt: 2 }}>
        {comments.map((comment) => (
          <React.Fragment key={comment.id}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar
                  src={comment.user.profile?.avatarUrl}
                  alt={comment.user.name}
                />
              </ListItemAvatar>
              <ListItemText
                primary={comment.user.name}
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {comment.content}
                    </Typography>
                    <br />
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};
