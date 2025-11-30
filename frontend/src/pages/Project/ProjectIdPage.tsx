import React, { useEffect, useMemo, useState } from 'react';
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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Pagination,
} from '@mui/material';
import {
  ArrowBack,
  Comment as CommentIcon,
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
    getProjectTeamMembers,
    getProjectUpdates,
    fetchAllTypes,
    allTypes,

    supportProject,
    unsupportProject,
    followProject,
    unfollowProject,

    comments,
    updates,
    teamMembers,
    actionLoading,
    loading,
  } = useShowcase();

  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) return;

    // Avoid repeated fetches caused by unstable function identities in context
    // only fetch when projectId changes
    let cancelled = false;
    const lastFetchedKey = `__project_fetched__:${projectId}`;
    // Use a window-level marker to persist across remounts in the same SPA session
    // so navigating away and back won't immediately re-trigger network calls.
    // This is conservative; you can remove window-level caching if stricter freshness is desired.

    const w = window as unknown as Record<string, unknown>;

    const already = w[lastFetchedKey] as boolean | undefined;
    if (already) return;

    (async () => {
      try {
        // Fetch project details (detailed)
        await getProjectById(projectId, true, true);

        // ensure we have project type labels available (tags mapping)
        await fetchAllTypes().catch(() => {});

        if (!cancelled) {
          // mark as fetched for this session

          w[lastFetchedKey] = true;
        }
      } catch {
        // ignore - context will handle errors
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally only depend on projectId to avoid repeats from changing function identities
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const [tabIndex, setTabIndex] = useState<number>(0);
  const [commentPage, setCommentPage] = useState<number>(1);
  const COMMENTS_PER_PAGE = 10;
  const totalComments = projectById?._count?.comments || 0;
  const totalPages = Math.max(1, Math.ceil(totalComments / COMMENTS_PER_PAGE));

  const projectComments = useMemo(
    () => comments?.[projectId as string]?.data || [],
    [comments, projectId]
  );

  const projectUpdates = useMemo(
    () => updates?.[projectId as string] || [],
    [updates, projectId]
  );

  const projectTeam = useMemo(
    () => teamMembers?.[projectId as string] || [],
    [teamMembers, projectId]
  );

  const getTagLabel = (tag: string) => {
    if (!allTypes || allTypes.length === 0) return tag;
    const found = allTypes.find((t) => t.id === tag || t.name === tag);
    return found ? found.name : tag;
  };

  // lazy-load per tab
  useEffect(() => {
    if (!projectId) return;

    // Only load data for a tab if we don't already have it cached
    (async () => {
      try {
        if (tabIndex === 1) {
          // Team
          const existing = teamMembers?.[projectId as string] || [];
          if (!existing || existing.length === 0) {
            await getProjectTeamMembers(projectId).catch(() => {});
          }
        }
        if (tabIndex === 2) {
          // Comments - only fetch first page if none cached
          const existingComments = comments?.[projectId as string]?.data || [];
          if (!existingComments || existingComments.length === 0) {
            await getComments(projectId, commentPage, false).catch(() => {});
          }
        }
        if (tabIndex === 3) {
          // Updates
          const existingUpdates = updates?.[projectId as string] || [];
          if (!existingUpdates || existingUpdates.length === 0) {
            await getProjectUpdates(projectId).catch(() => {});
          }
        }
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabIndex, projectId]);

  // When the user navigates pages in the Comments tab, fetch that page if not present
  useEffect(() => {
    if (!projectId) return;
    if (tabIndex !== 2) return;

    const existing = comments?.[projectId as string]?.data || [];
    const start = (commentPage - 1) * COMMENTS_PER_PAGE;
    const hasPage = existing.length > start;

    if (!hasPage) {
      getComments(projectId, commentPage, true).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentPage, tabIndex, projectId]);

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
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{ p: { xs: 2, md: 3 }, borderBottom: 1, borderColor: 'divider' }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ mb: { xs: 1, md: 2 } }}
        >
          <IconButton onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          {!projectById && loading ? (
            <Skeleton variant="text" width={300} />
          ) : (
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
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

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              size="small"
              onClick={() => onSupport(isSupported)}
            >
              {isSupported ? 'Unsupport' : 'Support'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onFollow(isFollowing)}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
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
        </Stack>

        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab
            label={`Team${projectById?._count?.teamMembers ? ` (${projectById._count.teamMembers})` : ''}`}
          />
          <Tab
            label={`Comments${projectById?._count?.comments ? ` (${projectById._count.comments})` : ''}`}
          />
          <Tab
            label={`Updates${projectById?._count?.updates ? ` (${projectById._count.updates})` : ''}`}
          />
        </Tabs>
      </Box>

      {/* Content area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 } }}>
        {!projectById ? (
          <Box>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={240}
              sx={{ mb: 2 }}
            />
            <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" sx={{ mb: 1 }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {projectById.imageUrl && (
                <Box
                  sx={{
                    height: { xs: 160, md: 320 },
                    borderRadius: 2,
                    mb: 2,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundImage: `url(${projectById.imageUrl})`,
                  }}
                />
              )}

              {tabIndex === 0 && (
                <>
                  {/* Seeking collaborators banner */}
                  {(
                    projectById.seekingCollaboration ||
                    projectById.seeking ||
                    []
                  ).length > 0 && (
                    <Card
                      variant="outlined"
                      sx={{ mb: 2, bgcolor: 'rgba(63,81,181,0.04)' }}
                    >
                      <CardContent>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Box>
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 700 }}
                            >
                              Seeking collaborators
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              This project is actively looking for contributors
                              — see what they're seeking below.
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ flexWrap: 'wrap' }}
                            >
                              {(
                                projectById.seeking ||
                                projectById.seekingCollaboration ||
                                []
                              ).map((s) => (
                                <Chip
                                  key={s}
                                  label={getTagLabel(s)}
                                  color="primary"
                                  size="small"
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Stack>
                          </Box>
                          <Box>
                            <Button
                              variant="contained"
                              onClick={() =>
                                navigate(`/projects/${projectId}/collaborate`)
                              }
                            >
                              Request to collaborate
                            </Button>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Description
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mb: 2, whiteSpace: 'pre-line' }}
                  >
                    {projectById.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mb: 2, flexWrap: 'wrap' }}
                  >
                    {(projectById.tags || []).map((t) => (
                      <Chip key={t} label={t} sx={{ mr: 1, mb: 1 }} />
                    ))}
                    {(projectById.skills || []).map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Stack>

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
                            A quick preview of the latest discussion.
                          </Typography>
                        </Stack>
                        <Button
                          startIcon={<CommentIcon />}
                          onClick={() => setTabIndex(2)}
                        >
                          View all comments
                        </Button>
                      </Stack>

                      <Box sx={{ mt: 2 }}>
                        {projectComments && projectComments.length > 0 ? (
                          projectComments.slice(0, 3).map((c) => (
                            <Box
                              key={c.id}
                              sx={{ display: 'flex', gap: 2, mb: 2 }}
                            >
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
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {c.comment.length > 140
                                    ? `${c.comment.slice(0, 140)}…`
                                    : c.comment}
                                </Typography>
                              </Box>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Comments are loaded when you open the Comments tab.
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </>
              )}

              {tabIndex === 1 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Team
                  </Typography>
                  {actionLoading.teamMembers ? (
                    <CircularProgress size={24} />
                  ) : (
                    <List>
                      {projectTeam.length > 0 ? (
                        projectTeam.map((m) => (
                          <ListItem key={m.id} divider>
                            <ListItemAvatar>
                              <Avatar src={m.user?.profile?.avatarUrl} />
                            </ListItemAvatar>
                            <ListItemText
                              primary={m.role || m.user?.name}
                              secondary={m.user?.name}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No team members yet.
                        </Typography>
                      )}
                    </List>
                  )}
                </>
              )}

              {tabIndex === 2 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Comments
                  </Typography>
                  {actionLoading.comment ? (
                    <CircularProgress size={24} />
                  ) : (
                    <>
                      <List>
                        {projectComments.length > 0 ? (
                          projectComments
                            .slice(
                              (commentPage - 1) * COMMENTS_PER_PAGE,
                              commentPage * COMMENTS_PER_PAGE
                            )
                            .map((c) => (
                              <ListItem
                                key={c.id}
                                alignItems="flex-start"
                                divider
                              >
                                <ListItemAvatar>
                                  <Avatar src={c.user?.profile?.avatarUrl} />
                                </ListItemAvatar>
                                <ListItemText
                                  primary={c.user?.name}
                                  secondary={c.comment}
                                />
                              </ListItem>
                            ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No comments yet.
                          </Typography>
                        )}
                      </List>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mt: 2,
                        }}
                      >
                        <Pagination
                          count={totalPages}
                          page={commentPage}
                          onChange={(_, p) => setCommentPage(p)}
                          color="primary"
                          boundaryCount={1}
                        />
                      </Box>
                    </>
                  )}
                </>
              )}

              {tabIndex === 3 && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Updates
                  </Typography>
                  {actionLoading.updates ? (
                    <CircularProgress size={24} />
                  ) : (
                    <List>
                      {projectUpdates.length > 0 ? (
                        projectUpdates.map((u) => (
                          <ListItem key={u.id} divider>
                            <ListItemText
                              primary={u.title || 'Update'}
                              secondary={u.content || ''}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No updates yet.
                        </Typography>
                      )}
                    </List>
                  )}
                </>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  position: 'sticky',
                  top: 16,
                }}
              >
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

                  <Divider />

                  <Typography variant="subtitle2">Project details</Typography>
                  <Typography variant="body2">
                    Owner: {projectById.owner?.name}
                  </Typography>
                  <Typography variant="body2">
                    Status: {projectById.status}
                  </Typography>
                  <Typography variant="body2">
                    Team size: {projectById._count?.teamMembers || 0}
                  </Typography>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};
export default ProjectIdPage;
