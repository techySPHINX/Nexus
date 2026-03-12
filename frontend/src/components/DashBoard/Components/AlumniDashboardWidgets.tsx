import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  AddRounded,
  AccessTimeFilled,
  AutoGraphRounded,
  BoltRounded,
  DragIndicator,
  EditRounded,
  EventRounded,
  FlagRounded,
  ForumOutlined,
  MailOutlineRounded,
  PersonOutlineRounded,
  RefreshRounded,
  RemoveRounded,
  ThumbUp,
  TrendingUpRounded,
  ChatBubbleOutline,
  PostAdd,
  ShareRounded,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { LinearProgress } from '@mui/material';
import { DashboardLayoutItem } from '@/services/DashBoardService';
import NetworkOverview from './NetworkOverview';
import ProfileStrength from './ProfileStrength';
import RecommendedProjects from './RecommendedProjects';
import RecentPosts from './RecentPosts';
import RecommendedConnection from './RecommendedConnection';
import UpcomingEvents from './UpcomingEvents';
import Leaderboard from './LeaderBoard';
import {
  getPostByUserIdService,
  getPostStatsService,
} from '@/services/PostService';
import DeferredSection from '../ui/DeferredSection';

export const alumniWidgetTitles = {
  connection_stats: 'Connection Stats',
  message_activity: 'Message Activity',
  profile: 'Profile',
  recommended_connection: 'Recommended Connection',
  community: 'Community',
  referrals: 'Referrals',
  events: 'Events',
  leaderboard: 'Leaderboard',
  quick_actions: 'Quick Actions',
  alumni_post_engagement: 'My Post Interaction',
  alumni_growth_goal: 'Growth Goal',
  alumni_influence: 'Influence Score',
} as const;

export type AlumniWidgetId = keyof typeof alumniWidgetTitles;
export type DashboardColumn = 'left' | 'right';

const DEFAULT_ALUMNI_GOAL = 100;
const MIN_ALUMNI_GOAL = 40;
const MAX_ALUMNI_GOAL = 1000;
const ALUMNI_GOAL_STEP = 20;

const clampAlumniGoal = (value: number): number =>
  Math.min(MAX_ALUMNI_GOAL, Math.max(MIN_ALUMNI_GOAL, value));

interface AlumniDashboardWidgetsProps {
  layout: DashboardLayoutItem[];
  column: DashboardColumn;
  isEditMode: boolean;
  widgets: Record<
    string,
    { visible: boolean; settings?: Record<string, unknown> }
  >;
  userId?: string;
  statsMessages: number;
  statsPendingRequests: number;
  statsConnectionsTotal: number;
  statsRecentConnections: number;
  onDragStart: (column: DashboardColumn, id: string) => void;
  onDrop: (column: DashboardColumn, id: string) => void;
  onNavigate: (path: string) => void;
}

const AlumniDashboardWidgets: FC<AlumniDashboardWidgetsProps> = ({
  layout,
  column,
  isEditMode,
  widgets,
  userId,
  statsMessages,
  statsPendingRequests,
  statsConnectionsTotal,
  statsRecentConnections,
  onDragStart,
  onDrop,
  onNavigate,
}) => {
  const theme = useTheme();
  const goalStorageKey = useMemo(
    () => `nexus:dashboard:alumni-growth-goal:${userId ?? 'anon'}`,
    [userId]
  );
  const selfContainedWidgets = new Set<AlumniWidgetId>([
    'connection_stats',
    'profile',
    'recommended_connection',
    'community',
    'referrals',
    'events',
    'leaderboard',
  ]);

  const [engagement, setEngagement] = useState({
    posts: 0,
    likes: 0,
    comments: 0,
  });
  const [alumniGoal, setAlumniGoal] = useState(DEFAULT_ALUMNI_GOAL);
  const [goalInput, setGoalInput] = useState(String(DEFAULT_ALUMNI_GOAL));
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isEngagementLoading, setIsEngagementLoading] = useState(false);
  const [engagementError, setEngagementError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedValue = window.localStorage.getItem(goalStorageKey);
    const parsedGoal = Number.parseInt(storedValue ?? '', 10);
    const safeGoal = Number.isFinite(parsedGoal)
      ? clampAlumniGoal(parsedGoal)
      : DEFAULT_ALUMNI_GOAL;
    setAlumniGoal(safeGoal);
    setGoalInput(String(safeGoal));
  }, [goalStorageKey]);

  const updateAlumniGoal = useCallback(
    (nextGoal: number) => {
      const safeGoal = clampAlumniGoal(nextGoal);
      setAlumniGoal(safeGoal);
      setGoalInput(String(safeGoal));
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(goalStorageKey, String(safeGoal));
    },
    [goalStorageKey]
  );

  const handleGoalSave = useCallback(() => {
    const parsedGoal = Number.parseInt(goalInput, 10);
    if (Number.isFinite(parsedGoal)) {
      updateAlumniGoal(parsedGoal);
    }
    setIsGoalDialogOpen(false);
  }, [goalInput, updateAlumniGoal]);

  const loadEngagement = useCallback(async () => {
    if (!userId) return;
    setIsEngagementLoading(true);
    setEngagementError(null);
    try {
      const response = await getPostByUserIdService(userId, 1, 5);
      const posts = Array.isArray(response?.posts) ? response.posts : [];
      if (posts.length === 0) {
        setEngagement({
          posts: 0,
          likes: 0,
          comments: 0,
        });
        return;
      }

      const totals = await Promise.allSettled(
        posts.map(async (post: { id: string }) => getPostStatsService(post.id))
      );

      const likes = totals.reduce((sum, item) => {
        if (item.status !== 'fulfilled') return sum;
        return sum + (item.value?.upvotes ?? 0);
      }, 0);
      const comments = totals.reduce((sum, item) => {
        if (item.status !== 'fulfilled') return sum;
        return sum + (item.value?.comments ?? 0);
      }, 0);

      setEngagement({
        posts: posts.length,
        likes,
        comments,
      });
    } catch {
      setEngagementError('Could not load post interaction right now.');
    } finally {
      setIsEngagementLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadEngagement();
  }, [loadEngagement]);

  const postEngagementCard = useMemo(
    () => (
      <Stack spacing={1.5}>
        <Box
          sx={{
            p: 2.25,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.08
            )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 62%)`,
            transition: 'transform 160ms ease, box-shadow 160ms ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 10px 24px ${alpha(theme.palette.common.black, 0.1)}`,
            },
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <PostAdd fontSize="small" color="primary" />
            <Typography variant="body2" color="text.secondary">
              Recent Posts
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="text"
              startIcon={<RefreshRounded fontSize="small" />}
              onClick={() => void loadEngagement()}
              disabled={isEngagementLoading}
            >
              Refresh
            </Button>
          </Stack>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <TrendingUpRounded fontSize="small" color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {engagement.likes + engagement.comments}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              total interactions
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Based on your latest {engagement.posts} posts.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center" mb={0.5}>
              <ThumbUp fontSize="small" color="primary" />
              <Typography variant="caption" color="text.secondary">
                Likes
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {engagement.likes}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center" mb={0.5}>
              <ChatBubbleOutline fontSize="small" color="primary" />
              <Typography variant="caption" color="text.secondary">
                Comments
              </Typography>
            </Stack>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {engagement.comments}
            </Typography>
          </Box>
        </Stack>
        {engagementError ? (
          <Typography variant="caption" color="error">
            {engagementError}
          </Typography>
        ) : null}
        {isEngagementLoading ? (
          <Typography variant="caption" color="text.secondary">
            Updating interaction metrics...
          </Typography>
        ) : null}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            size="small"
            variant="text"
            onClick={() => onNavigate('/feed')}
            startIcon={<PostAdd fontSize="small" />}
          >
            Open Feed
          </Button>
          <Button
            size="small"
            variant="text"
            onClick={() => onNavigate('/messages')}
          >
            Reply Faster
          </Button>
        </Stack>
      </Stack>
    ),
    [
      engagement,
      engagementError,
      isEngagementLoading,
      loadEngagement,
      onNavigate,
      theme,
    ]
  );

  const activityTone =
    statsMessages > 0
      ? 'success'
      : statsPendingRequests > 0
        ? 'warning'
        : 'default';
  const alumniGoalTone: 'success' | 'primary' | 'warning' =
    statsConnectionsTotal >= alumniGoal
      ? 'success'
      : statsConnectionsTotal >= Math.floor(alumniGoal * 0.6)
        ? 'primary'
        : 'warning';
  const alumniGoalProgress = Math.min(
    100,
    Math.round((statsConnectionsTotal / alumniGoal) * 100)
  );
  const alumniGoalRemaining = Math.max(alumniGoal - statsConnectionsTotal, 0);
  const influenceScore = Math.min(
    100,
    engagement.likes * 4 +
      engagement.comments * 3 +
      engagement.posts * 5 +
      statsRecentConnections
  );
  const influenceTone: 'success' | 'warning' | 'default' =
    influenceScore >= 70
      ? 'success'
      : influenceScore >= 40
        ? 'warning'
        : 'default';

  const renderWidgetBody = (id: AlumniWidgetId) => {
    switch (id) {
      case 'connection_stats':
        return <NetworkOverview />;
      case 'message_activity':
        return (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.08
              )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 60%)`,
              transition: 'transform 160ms ease, box-shadow 160ms ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 10px 24px ${alpha(
                  theme.palette.common.black,
                  0.1
                )}`,
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
              <ForumOutlined color="primary" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                Message Activity
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                size="small"
                color={activityTone}
                label={statsMessages > 0 ? 'Live' : 'Quiet'}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box
                sx={{
                  flex: 1,
                  p: 1.25,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  mb={0.5}
                >
                  <MailOutlineRounded fontSize="small" color="primary" />
                  <Typography variant="caption" color="text.secondary">
                    Conversations
                  </Typography>
                </Stack>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, lineHeight: 1.1 }}
                >
                  {statsMessages}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 1.25,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  mb={0.5}
                >
                  <PersonOutlineRounded fontSize="small" color="primary" />
                  <Typography variant="caption" color="text.secondary">
                    Pending Requests
                  </Typography>
                </Stack>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, lineHeight: 1.1 }}
                >
                  {statsPendingRequests}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.75} alignItems="center" mt={1.5}>
              <AccessTimeFilled sx={{ fontSize: 14 }} color="action" />
              <Typography variant="caption" color="text.secondary">
                Live totals from your inbox and connection pipeline.
              </Typography>
            </Stack>
          </Box>
        );
      case 'recommended_connection':
        return <RecommendedConnection />;
      case 'profile':
        return <ProfileStrength />;
      case 'community':
        return <RecentPosts />;
      case 'referrals':
        return <RecommendedProjects />;
      case 'events':
        return <UpcomingEvents />;
      case 'leaderboard':
        return (
          <Leaderboard currentUserId={userId} maxItems={6} compact={true} />
        );
      case 'quick_actions':
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PostAdd fontSize="small" />}
              onClick={() => onNavigate('/feed')}
            >
              Create Post
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ShareRounded fontSize="small" />}
              onClick={() => onNavigate('/referrals')}
            >
              Share Referral
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EventRounded fontSize="small" />}
              onClick={() => onNavigate('/messages')}
            >
              Reply to DMs
            </Button>
          </Stack>
        );
      case 'alumni_post_engagement':
        return postEngagementCard;
      case 'alumni_growth_goal':
        return (
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.07
              )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 65%)`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <FlagRounded color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Reach {alumniGoal} connections
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                size="small"
                color={alumniGoalTone}
                label={
                  alumniGoalRemaining === 0 ? 'Goal reached' : 'In progress'
                }
              />
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {statsConnectionsTotal}/{alumniGoal}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={alumniGoalProgress}
              sx={{ height: 8, borderRadius: 999 }}
            />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
              mt={1}
            >
              <Typography variant="caption" color="text.secondary">
                {alumniGoalRemaining > 0
                  ? `${alumniGoalRemaining} more to reach goal`
                  : 'Goal reached. Raise your target any time'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                +{statsRecentConnections} added in the last 30 days.
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5} mt={1.25}>
              <IconButton
                size="small"
                onClick={() => updateAlumniGoal(alumniGoal - ALUMNI_GOAL_STEP)}
                disabled={alumniGoal <= MIN_ALUMNI_GOAL}
              >
                <RemoveRounded fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => updateAlumniGoal(alumniGoal + ALUMNI_GOAL_STEP)}
                disabled={alumniGoal >= MAX_ALUMNI_GOAL}
              >
                <AddRounded fontSize="small" />
              </IconButton>
              <Button
                size="small"
                variant="text"
                startIcon={<EditRounded fontSize="small" />}
                onClick={() => setIsGoalDialogOpen(true)}
              >
                Set Goal
              </Button>
            </Stack>
          </Box>
        );
      case 'alumni_influence':
        return (
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <AutoGraphRounded color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Influence Score
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                size="small"
                color={influenceTone}
                label={
                  influenceScore >= 70
                    ? 'High'
                    : influenceScore >= 40
                      ? 'Steady'
                      : 'Low'
                }
              />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {influenceScore}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={influenceScore}
              sx={{ mt: 1, height: 7, borderRadius: 999 }}
            />
            <Typography variant="caption" color="text.secondary">
              Weighted from post likes, comments, and network growth.
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.75} mt={1}>
              <BoltRounded color="warning" sx={{ fontSize: 14 }} />
              <Typography variant="caption" color="text.secondary">
                Keep sharing insights to raise your weekly impact score.
              </Typography>
            </Stack>
            <Button
              size="small"
              variant="text"
              onClick={() => onNavigate('/feed')}
              sx={{ mt: 0.75, alignSelf: 'flex-start' }}
            >
              Publish an update
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack spacing={3}>
        {layout
          .filter((item) => item.i in alumniWidgetTitles)
          .filter((item) => widgets[item.i]?.visible !== false)
          .map((item) => {
            const widgetId = item.i as AlumniWidgetId;
            const body = renderWidgetBody(widgetId);
            const isSelfContained = selfContainedWidgets.has(widgetId);
            const minHeight = Math.max(180, item.h * 80);

            const content =
              !isEditMode && isSelfContained ? (
                <>{body}</>
              ) : (
                <Card
                  onDragOver={
                    isEditMode ? (e) => e.preventDefault() : undefined
                  }
                  onDrop={isEditMode ? () => onDrop(column, item.i) : undefined}
                  sx={{
                    minHeight: isEditMode
                      ? Math.max(160, item.h * 80)
                      : undefined,
                  }}
                >
                  <CardContent>
                    {isEditMode ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        draggable
                        onDragStart={() => onDragStart(column, item.i)}
                        sx={{ cursor: 'grab', mb: 1 }}
                      >
                        <DragIndicator fontSize="small" />
                        <Typography variant="subtitle1" fontWeight={600}>
                          {alumniWidgetTitles[widgetId]}
                        </Typography>
                      </Stack>
                    ) : null}
                    {body}
                  </CardContent>
                </Card>
              );

            return (
              <DeferredSection
                key={item.i}
                minHeight={minHeight}
                rootMargin="260px 0px"
                disabled={isEditMode}
              >
                {content}
              </DeferredSection>
            );
          })}
      </Stack>
      <Dialog
        open={isGoalDialogOpen}
        onClose={() => setIsGoalDialogOpen(false)}
      >
        <DialogTitle>Set Growth Goal</DialogTitle>
        <DialogContent sx={{ pt: '10px !important' }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Target connections"
            value={goalInput}
            onChange={(event) => setGoalInput(event.target.value)}
            inputProps={{
              min: MIN_ALUMNI_GOAL,
              max: MAX_ALUMNI_GOAL,
              step: ALUMNI_GOAL_STEP,
            }}
            helperText={`Set between ${MIN_ALUMNI_GOAL} and ${MAX_ALUMNI_GOAL}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsGoalDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              updateAlumniGoal(DEFAULT_ALUMNI_GOAL);
              setIsGoalDialogOpen(false);
            }}
          >
            Reset
          </Button>
          <Button onClick={handleGoalSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AlumniDashboardWidgets;
