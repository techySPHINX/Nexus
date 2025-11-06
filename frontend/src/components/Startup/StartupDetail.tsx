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
  Stack,
  IconButton,
} from '@mui/material';
import { Language, Close } from '@mui/icons-material';
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
  if (!startup) return null;

  return (
    <>
      {/* HEADER */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor:
            'linear-gradient(90deg, rgba(59,130,246,0.05), rgba(99,102,241,0.05))',
          py: 2,
          px: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={startup.imageUrl}
            sx={{
              width: 72,
              height: 72,
              borderRadius: 3,
              boxShadow: '0 4px 14px rgba(99,102,241,0.2)',
            }}
          />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {startup.name}
            </Typography>

            {startup.websiteUrl && (
              <Button
                size="small"
                startIcon={<Language />}
                onClick={() => window.open(startup.websiteUrl, '_blank')}
                sx={{ textTransform: 'none', color: 'primary.main', pl: 0 }}
              >
                {startup.websiteUrl}
              </Button>
            )}

            {startup.founder && (
              <ProfileNameLink
                user={startup.founder}
                showAvatar={false}
                variant="subtitle1"
              />
            )}
          </Box>
        </Stack>

        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
        {/* Chips Section */}
        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={1.5}
          justifyContent={{ xs: 'center', sm: 'flex-start' }}
          sx={{ mb: 3 }}
        >
          <Chip
            label={startup.status || 'IDEA'}
            color={
              startup.status === 'LAUNCHED'
                ? 'success'
                : startup.status === 'BETA'
                  ? 'primary'
                  : startup.status === 'PROTOTYPING'
                    ? 'warning'
                    : 'default'
            }
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`${startup.followersCount || 0} followers`}
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
          {startup.fundingGoal && (
            <Chip
              label={`$${startup.fundingRaised || 0} / $${startup.fundingGoal} raised`}
              color="info"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          )}
        </Stack>

        {/* Description */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.7,
              color: 'text.primary',
              fontSize: { xs: '0.95rem', sm: '1rem' },
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              WebkitLineClamp: showFullDescription ? 'unset' : 4,
            }}
          >
            {startup.description || 'No description provided.'}
          </Typography>

          {startup.description && (
            <Button
              size="small"
              onClick={() => setShowFullDescription((s) => !s)}
              sx={{ mt: 0.5 }}
            >
              {showFullDescription ? 'Show less' : 'Read more'}
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* COMMENTS SECTION */}
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}
        >
          Comments ({comments.length})
        </Typography>

        <Box
          sx={{
            maxHeight: 360,
            overflowY: 'auto',
            pr: 1,
            borderRadius: 2,
            bgcolor: 'rgba(250,250,255,0.5)',
          }}
        >
          {commentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography variant="body2">Loading comments...</Typography>
            </Box>
          ) : (
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      py: 2,
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      opacity: comment.pending ? 0.6 : 1,
                    }}
                  >
                    <Avatar
                      src={comment.user?.profile?.avatarUrl}
                      alt={comment.user?.name}
                      sx={{ width: 36, height: 36 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        sx={{ mb: 0.5 }}
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
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}
                      >
                        {comment.comment}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {!commentsLoading && comments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No comments yet. Be the first to comment!
              </Typography>
            </Box>
          )}
        </Box>

        {/* COMMENT INPUT */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            mt: 3,
            alignItems: { sm: 'center' },
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
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Post
          </Button>
        </Box>
      </DialogContent>

      {/* ACTIONS FOOTER */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          background: 'rgba(99,102,241,0.03)',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          Close
        </Button>
        <Button
          variant={startup.isFollowing ? 'outlined' : 'contained'}
          onClick={onFollowToggle}
          sx={{
            borderRadius: 2,
            minWidth: 120,
            transition: 'all 0.25s ease',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          {startup.isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      </DialogActions>
    </>
  );
};

export default StartupDetail;
