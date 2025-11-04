import React from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Avatar,
  Typography,
  Button,
  Chip,
  Divider,
  TextField,
} from '@mui/material';
import { Language } from '@mui/icons-material';
import {
  StartupDetail as StartupDetailType,
  StartupComment,
} from '@/types/StartupType';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  startup: StartupDetailType | null;
  comments: StartupComment[];
  commentsLoading: boolean;
  showFullDescription: boolean;
  setShowFullDescription: React.Dispatch<React.SetStateAction<boolean>>;
  commentValue: string;
  setCommentValue: (v: string) => void;
  onPostComment: () => void;
  onClose: () => void;
  onFollowToggle: () => Promise<void> | void;
}

const StartupDetail: React.FC<Props> = ({
  startup,
  comments,
  commentsLoading,
  showFullDescription,
  setShowFullDescription,
  commentValue,
  setCommentValue,
  onPostComment,
  onClose,
  onFollowToggle,
}) => {
  return (
    <>
      <DialogTitle
        sx={{
          background:
            'linear-gradient(90deg, rgba(14,165,233,0.08), rgba(99,102,241,0.06))',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={startup?.imageUrl}
            sx={{
              width: 56,
              height: 56,
              boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
            }}
          />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {startup?.name}
            </Typography>
            {startup?.websiteUrl && (
              <Button
                size="small"
                startIcon={<Language />}
                onClick={() => window.open(startup?.websiteUrl, '_blank')}
              >
                {startup?.websiteUrl}
              </Button>
            )}
            {startup?.founder && (
              <ProfileNameLink
                user={startup.founder}
                showAvatar
                variant="subtitle1"
              />
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 3,
            mt: 3,
            justifyContent: { xs: 'center', sm: 'flex-start' },
          }}
        >
          <Chip
            label={startup?.status || 'IDEA'}
            color={
              startup?.status === 'LAUNCHED'
                ? 'success'
                : startup?.status === 'BETA'
                  ? 'primary'
                  : startup?.status === 'PROTOTYPING'
                    ? 'warning'
                    : 'default'
            }
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`${startup?.followersCount || 0} followers`}
            variant="outlined"
          />
          {startup?.fundingGoal && (
            <Chip
              label={`$${startup.fundingRaised || 0} / $${startup.fundingGoal} raised`}
              color="info"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          )}
        </Box>

        {/* Description */}
        <Box sx={{ mb: 3 }}>
          {startup?.description ? (
            <>
              <Typography
                variant="body1"
                sx={{
                  mb: 1,
                  lineHeight: 1.7,
                  color: 'text.primary',
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                }}
                noWrap={!showFullDescription}
                style={
                  showFullDescription
                    ? {}
                    : {
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }
                }
              >
                {startup.description}
              </Typography>
              <Button
                size="small"
                onClick={() => setShowFullDescription((s) => !s)}
                sx={{ mt: 0.5 }}
              >
                {showFullDescription ? 'Show less' : 'Read more'}
              </Button>
            </>
          ) : (
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              No description provided.
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          Comments ({comments.length})
        </Typography>

        {commentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography variant="body2">Loading comments...</Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      py: 2,
                      px: 1,
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      opacity: comment.pending ? 0.7 : 1,
                    }}
                  >
                    <Avatar src={comment.user?.profile?.avatarUrl} />
                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={600}>
                          {comment.user?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </Typography>
                        {comment.pending && (
                          <Chip
                            label="Sending..."
                            size="small"
                            color="warning"
                          />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: 'break-word',
                          color: 'text.secondary',
                        }}
                      >
                        {comment.comment}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>

            {comments.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No comments yet. Be the first to comment!
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Add Comment */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            mt: 3,
          }}
        >
          <TextField
            fullWidth
            value={commentValue}
            onChange={(e) => setCommentValue(e.target.value)}
            placeholder="Share your thoughts..."
            multiline
            maxRows={3}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.6)',
              },
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onPostComment();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={onPostComment}
            disabled={!commentValue.trim() || commentsLoading}
            sx={{
              minWidth: { xs: '100%', sm: 120 },
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
            }}
          >
            Post
          </Button>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          background: 'rgba(99,102,241,0.03)',
          justifyContent: 'space-between',
        }}
      >
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          Close
        </Button>
        {startup && (
          <Button
            variant={startup.isFollowing ? 'outlined' : 'contained'}
            onClick={onFollowToggle}
            sx={{
              borderRadius: 2,
              minWidth: 120,
              transition: 'all 0.25s ease',
            }}
          >
            {startup.isFollowing ? 'Unfollow' : 'Follow'}
          </Button>
        )}
      </DialogActions>
    </>
  );
};

export default StartupDetail;
