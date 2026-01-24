import { FC, KeyboardEvent, useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Avatar,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  Public,
  Group,
  Lock,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface CreatePostProps {
  onSubmit: (
    content: string,
    visibility: 'public' | 'connections' | 'private'
  ) => void;
  placeholder?: string;
}

const CreatePost: FC<CreatePostProps> = ({
  onSubmit,
  placeholder = "What's on your mind?",
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility] = useState<'public' | 'connections' | 'private'>('public');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content.trim(), visibility);
      setContent('');
      setIsExpanded(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getVisibilityIcon = (vis: string) => {
    switch (vis) {
      case 'public':
        return <Public fontSize="small" />;
      case 'connections':
        return <Group fontSize="small" />;
      case 'private':
        return <Lock fontSize="small" />;
      default:
        return <Public fontSize="small" />;
    }
  };

  const getVisibilityLabel = (vis: string) => {
    switch (vis) {
      case 'public':
        return 'Everyone';
      case 'connections':
        return 'Connections';
      case 'private':
        return 'Only me';
      default:
        return 'Everyone';
    }
  };

  const getVisibilityColor = (vis: string) => {
    switch (vis) {
      case 'public':
        return 'primary';
      case 'connections':
        return 'secondary';
      case 'private':
        return 'default';
      default:
        return 'primary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {user?.name}
              </Typography>
              <Chip
                icon={getVisibilityIcon(visibility)}
                label={getVisibilityLabel(visibility)}
                size="small"
                color={getVisibilityColor(visibility)}
                variant="outlined"
                onClick={() => setIsExpanded(!isExpanded)}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={isExpanded ? 4 : 2}
            placeholder={placeholder}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsExpanded(true)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: 'divider',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 2,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Attach file">
                    <IconButton size="small" color="primary">
                      <AttachFile />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add emoji">
                    <IconButton size="small" color="primary">
                      <EmojiEmotions />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  startIcon={<Send />}
                  sx={{ borderRadius: 2 }}
                >
                  Post
                </Button>
              </Box>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CreatePost;
