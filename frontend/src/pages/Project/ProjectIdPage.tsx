import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Avatar,
  Chip,
  Button,
  Stack,
  Skeleton,
  IconButton,
  Divider,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  Comment as CommentIcon,
  Update as UpdateIcon,
  Group as GroupIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useShowcase } from '@/contexts/ShowcaseContext';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import { useAuth } from '@/contexts/AuthContext';

const ProjectIdPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const {
    projectById,
    getProjectById,
    getComments,

    supportProject,
    unsupportProject,
    followProject,
    unfollowProject,

    comments,
    loading,
  } = useShowcase();

  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) return;
    getProjectById(projectId, true).catch(() => {});
    getComments(projectId).catch(() => {});
  }, [projectId, getProjectById, getComments]);

  if (!projectId) return null;

  const onSupport = async (isSupported: boolean) => {
    if (!projectById) return;
    try {
      if (isSupported) await unsupportProject(projectById.id);
      else await supportProject(projectById.id);
    } catch {
      // context handles errors
    }
  };

  const onFollow = async (isFollowing: boolean) => {
    if (!projectById) return;
    try {
      if (isFollowing) await unfollowProject(projectById.id);
      else await followProject(projectById.id);
    } catch (e) {
      console.error(e);
    }
  };

  const isSupported = !!projectById?.supporters?.some(
    (s) => s.userId === user?.id
  );
  const isFollowing = !!projectById?.followers?.some(
    (f) => f.userId === user?.id
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        {!projectById && loading ? (
          <Skeleton variant="text" width={300} />
        ) : (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {projectById?.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {projectById?.owner && (
                <ProfileNameLink
                  user={{
                    id: projectById.owner.id,
                    name: projectById.owner.name,
                    profile: {
                      avatarUrl: projectById.owner.profile?.avatarUrl,
                    },
                  }}
                  showAvatar={false}
                />
              )}
              <Chip
                label={projectById?.status || 'UNKNOWN'}
                size="small"
                sx={{ ml: 1 }}
                color={
                  projectById?.status === 'COMPLETED' ? 'success' : 'default'
                }
              />
            </Stack>
          </Box>
        )}
      </Stack>

      {!projectById ? (
        <Box>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={300}
            sx={{ mb: 2 }}
          />
          <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" sx={{ mb: 1 }} />
          <Skeleton variant="text" width="40%" sx={{ mb: 3 }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {projectById.imageUrl && (
              <Box
                sx={{
                  height: 320,
                  borderRadius: 2,
                  mb: 2,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundImage: `url(${projectById.imageUrl})`,
                }}
              />
            )}

            <Typography variant="h6" sx={{ mb: 2 }}>
              Description
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-line' }}>
              {projectById.description}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>
              Updates
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack>
                    <Typography variant="h6">Comments</Typography>
                    <Typography variant="body2" color="text.secondary">
                      A quick preview of the latest discussion. Open the full
                      comments page to read and post.
                    </Typography>
                  </Stack>
                  <Button
                    startIcon={<CommentIcon />}
                    onClick={() => navigate(`/projects/${projectId}/comments`)}
                  >
                    View all comments
                  </Button>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  {(comments?.[projectId as string]?.data || [])
                    .slice(0, 2)
                    .map((c) => (
                      <Box key={c.id} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Avatar
                          src={c.user?.profile?.avatarUrl}
                          sx={{ width: 40, height: 40 }}
                        />
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {c.user?.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {c.comment.length > 140
                              ? `${c.comment.slice(0, 140)}…`
                              : c.comment}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                </Box>
              </CardContent>
            </Card>

            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Button
                startIcon={<UpdateIcon />}
                variant="outlined"
                onClick={() => navigate(`/projects/${projectId}/updates`)}
              >
                View updates
              </Button>
              <Button
                startIcon={<GroupIcon />}
                variant="outlined"
                onClick={() => navigate(`/projects/${projectId}/team`)}
              >
                View team
              </Button>
              <Tooltip title="Share">
                <IconButton
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                  }}
                >
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2">Supporters</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {projectById._count?.supporters || 0}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2">Followers</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {projectById._count?.followers || 0}
                  </Typography>
                </Stack>

                <Divider />

                <Button
                  variant="contained"
                  onClick={() => onSupport(isSupported)}
                >
                  {isSupported ? 'Unsupport' : 'Support'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => onFollow(isFollowing)}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
export default ProjectIdPage;
