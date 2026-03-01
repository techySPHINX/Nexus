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
  BoltRounded,
  DragIndicator,
  EditRounded,
  EventRounded,
  FlagRounded,
  ForumOutlined,
  InsightsRounded,
  MailOutlineRounded,
  PersonOutlineRounded,
  RemoveRounded,
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
import DeferredSection from '../ui/DeferredSection';

export const studentWidgetTitles = {
  connection_stats: 'Connection Stats',
  message_activity: 'Message Activity',
  profile: 'Profile',
  recommended_connection: 'Recommended Connection',
  community: 'Community',
  referrals: 'Referrals',
  events: 'Events',
  leaderboard: 'Leaderboard',
  quick_actions: 'Quick Actions',
  student_network_goal: 'Network Goal',
  student_activity_pulse: 'Activity Pulse',
} as const;

export type StudentWidgetId = keyof typeof studentWidgetTitles;
export type DashboardColumn = 'left' | 'right';

const DEFAULT_CONNECTION_GOAL = 50;
const MIN_CONNECTION_GOAL = 20;
const MAX_CONNECTION_GOAL = 500;
const CONNECTION_GOAL_STEP = 10;

const clampGoal = (value: number): number =>
  Math.min(MAX_CONNECTION_GOAL, Math.max(MIN_CONNECTION_GOAL, value));

interface StudentDashboardWidgetsProps {
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

const StudentDashboardWidgets: FC<StudentDashboardWidgetsProps> = ({
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
    () => `nexus:dashboard:student-network-goal:${userId ?? 'anon'}`,
    [userId]
  );
  const [connectionGoal, setConnectionGoal] = useState(DEFAULT_CONNECTION_GOAL);
  const [goalInput, setGoalInput] = useState(String(DEFAULT_CONNECTION_GOAL));
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  const selfContainedWidgets = new Set<StudentWidgetId>([
    'connection_stats',
    'profile',
    'recommended_connection',
    'community',
    'referrals',
    'events',
    'leaderboard',
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedValue = window.localStorage.getItem(goalStorageKey);
    const parsedGoal = Number.parseInt(storedValue ?? '', 10);
    const safeGoal = Number.isFinite(parsedGoal)
      ? clampGoal(parsedGoal)
      : DEFAULT_CONNECTION_GOAL;
    setConnectionGoal(safeGoal);
    setGoalInput(String(safeGoal));
  }, [goalStorageKey]);

  const updateConnectionGoal = useCallback(
    (nextGoal: number) => {
      const safeGoal = clampGoal(nextGoal);
      setConnectionGoal(safeGoal);
      setGoalInput(String(safeGoal));
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(goalStorageKey, String(safeGoal));
    },
    [goalStorageKey]
  );

  const handleGoalSave = useCallback(() => {
    const parsedGoal = Number.parseInt(goalInput, 10);
    if (Number.isFinite(parsedGoal)) {
      updateConnectionGoal(parsedGoal);
    }
    setIsGoalDialogOpen(false);
  }, [goalInput, updateConnectionGoal]);

  const activityTone =
    statsMessages > 0
      ? 'success'
      : statsPendingRequests > 0
        ? 'warning'
        : 'default';
  const goalTone: 'success' | 'primary' | 'warning' =
    statsConnectionsTotal >= connectionGoal
      ? 'success'
      : statsConnectionsTotal >= Math.floor(connectionGoal * 0.6)
        ? 'primary'
        : 'warning';
  const connectionGoalProgress = Math.min(
    100,
    Math.round((statsConnectionsTotal / connectionGoal) * 100)
  );
  const goalRemaining = Math.max(connectionGoal - statsConnectionsTotal, 0);
  const activityPulseScore = Math.min(
    100,
    statsMessages * 8 + statsPendingRequests * 5 + statsRecentConnections * 2
  );
  const activityPulseTone: 'success' | 'warning' | 'default' =
    activityPulseScore >= 70
      ? 'success'
      : activityPulseScore >= 40
        ? 'warning'
        : 'default';

  const renderWidgetBody = (id: StudentWidgetId) => {
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
                Real-time updates from inbox and connection requests.
              </Typography>
            </Stack>
          </Box>
        );
      case 'profile':
        return <ProfileStrength />;
      case 'recommended_connection':
        return <RecommendedConnection />;
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
              startIcon={<ForumOutlined fontSize="small" />}
              onClick={() => onNavigate('/messages')}
            >
              Open Messages
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EventRounded fontSize="small" />}
              onClick={() => onNavigate('/events')}
            >
              Explore Events
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PersonOutlineRounded fontSize="small" />}
              onClick={() => onNavigate('/profile')}
            >
              Edit Profile
            </Button>
          </Stack>
        );
      case 'student_network_goal':
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
            <Stack direction="row" alignItems="center" spacing={1} mb={1.25}>
              <FlagRounded color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Reach {connectionGoal} connections
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                size="small"
                color={goalTone}
                label={goalRemaining === 0 ? 'Goal reached' : 'In progress'}
              />
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {statsConnectionsTotal}/{connectionGoal}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={connectionGoalProgress}
              sx={{ height: 8, borderRadius: 999 }}
            />
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
              mt={1}
            >
              <Typography variant="caption" color="text.secondary">
                {goalRemaining > 0
                  ? `${goalRemaining} more to hit your goal`
                  : 'You hit your connection target'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                +{statsRecentConnections} in the last 30 days.
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5} mt={1.25}>
              <IconButton
                size="small"
                onClick={() =>
                  updateConnectionGoal(connectionGoal - CONNECTION_GOAL_STEP)
                }
                disabled={connectionGoal <= MIN_CONNECTION_GOAL}
              >
                <RemoveRounded fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  updateConnectionGoal(connectionGoal + CONNECTION_GOAL_STEP)
                }
                disabled={connectionGoal >= MAX_CONNECTION_GOAL}
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
      case 'student_activity_pulse':
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
              <InsightsRounded color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Activity Pulse
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                size="small"
                color={activityPulseTone}
                label={
                  activityPulseScore >= 70
                    ? 'High'
                    : activityPulseScore >= 40
                      ? 'Steady'
                      : 'Low'
                }
              />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {activityPulseScore}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={activityPulseScore}
              sx={{ mt: 1, height: 7, borderRadius: 999 }}
            />
            <Typography variant="caption" color="text.secondary">
              Based on messages, pending requests, and recent growth.
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.75} mt={1}>
              <BoltRounded color="warning" sx={{ fontSize: 14 }} />
              <Typography variant="caption" color="text.secondary">
                Higher score means stronger weekly networking momentum.
              </Typography>
            </Stack>
            <Button
              size="small"
              variant="text"
              onClick={() => onNavigate('/messages')}
              sx={{ mt: 0.75, alignSelf: 'flex-start' }}
            >
              Boost activity
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
          .filter((item) => item.i in studentWidgetTitles)
          .filter((item) => widgets[item.i]?.visible !== false)
          .map((item) => {
            const widgetId = item.i as StudentWidgetId;
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
                          {studentWidgetTitles[widgetId]}
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
        <DialogTitle>Set Network Goal</DialogTitle>
        <DialogContent sx={{ pt: '10px !important' }}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="Target connections"
            value={goalInput}
            onChange={(event) => setGoalInput(event.target.value)}
            inputProps={{
              min: MIN_CONNECTION_GOAL,
              max: MAX_CONNECTION_GOAL,
              step: CONNECTION_GOAL_STEP,
            }}
            helperText={`Set between ${MIN_CONNECTION_GOAL} and ${MAX_CONNECTION_GOAL}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsGoalDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              updateConnectionGoal(DEFAULT_CONNECTION_GOAL);
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

export default StudentDashboardWidgets;
