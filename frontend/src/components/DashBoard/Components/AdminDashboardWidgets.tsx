import {
  FC,
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import {
  AnalyticsOutlined,
  DragIndicator,
  DoneAllRounded,
  EventAvailableRounded,
  ForumOutlined,
  Groups2Outlined,
  PendingActionsRounded,
  RefreshRounded,
  ReportProblemOutlined,
  ShieldOutlined,
  TaskAltRounded,
  VerifiedUserOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import api from '@/services/api';
import { DashboardLayoutItem } from '@/services/DashBoardService';
import Leaderboard from './LeaderBoard';
import DeferredSection from '../ui/DeferredSection';

export const adminWidgetTitles = {
  connection_stats: 'Connection Stats',
  message_activity: 'Message Activity',
  events: 'Events',
  leaderboard: 'Leaderboard',
  quick_actions: 'Quick Actions',
  admin_platform_health: 'Platform Health',
  admin_moderation_queue: 'Moderation Snapshot',
  admin_platform_totals: 'Platform Totals',
  admin_system_alerts: 'System Alerts',
} as const;

export type AdminWidgetId = keyof typeof adminWidgetTitles;
export type DashboardColumn = 'left' | 'right';

type AdminStatsResponse = {
  users?: {
    total?: number;
    active?: number;
    inactive?: number;
  };
  verifications?: {
    pending?: number;
    approvedToday?: number;
    rejectedToday?: number;
  };
  platform?: {
    posts?: number;
    projects?: number;
    referrals?: number;
    mentorships?: number;
  };
};

type AdminActivityResponse = {
  period?: string;
  newUsers?: number;
  activeSessions?: number;
  newPosts?: number;
  newProjects?: number;
};

type AdminHealthResponse = {
  status?: string;
  timestamp?: string;
  security?: {
    failedLogins?: number;
    lockedAccounts?: number;
    unverifiedEmails?: number;
    recentSecurityEvents?: number;
  };
};

interface AdminDashboardWidgetsProps {
  layout: DashboardLayoutItem[];
  column: DashboardColumn;
  isEditMode: boolean;
  widgets: Record<
    string,
    { visible: boolean; settings?: Record<string, unknown> }
  >;
  userId?: string;
  statsMessages: number;
  onDragStart: (column: DashboardColumn, id: string) => void;
  onDrop: (column: DashboardColumn, id: string) => void;
  onNavigate: (path: string) => void;
}

const AdminDashboardWidgets: FC<AdminDashboardWidgetsProps> = ({
  layout,
  column,
  isEditMode,
  widgets,
  userId,
  statsMessages,
  onDragStart,
  onDrop,
  onNavigate,
}) => {
  const theme = useTheme();
  const selfContainedWidgets = new Set<AdminWidgetId>(['leaderboard']);

  const [stats, setStats] = useState<AdminStatsResponse>({});
  const [activity, setActivity] = useState<AdminActivityResponse>({});
  const [health, setHealth] = useState<AdminHealthResponse>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [statsRes, activityRes, healthRes] = await Promise.allSettled([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/activity', { params: { days: 7 } }),
        api.get('/admin/dashboard/health'),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats((statsRes.value.data ?? {}) as AdminStatsResponse);
      }
      if (activityRes.status === 'fulfilled') {
        setActivity((activityRes.value.data ?? {}) as AdminActivityResponse);
      }
      if (healthRes.status === 'fulfilled') {
        setHealth((healthRes.value.data ?? {}) as AdminHealthResponse);
      }

      if (
        statsRes.status === 'rejected' &&
        activityRes.status === 'rejected' &&
        healthRes.status === 'rejected'
      ) {
        setLoadError('Could not load admin dashboard metrics');
      }
    } catch {
      setLoadError('Could not load admin dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const activeUsers = stats.users?.active ?? 0;
  const totalUsers = stats.users?.total ?? 0;
  const inactiveUsers =
    stats.users?.inactive ?? Math.max(totalUsers - activeUsers, 0);
  const activeRate =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const activeConversationMetric = useMemo(
    () => Math.max(statsMessages, activity.activeSessions ?? 0),
    [activity.activeSessions, statsMessages]
  );
  const verificationPending = stats.verifications?.pending ?? 0;
  const failedLogins = health.security?.failedLogins ?? 0;
  const lockedAccounts = health.security?.lockedAccounts ?? 0;

  const renderMetricTile = (
    label: string,
    value: number | string,
    icon: ReactNode
  ) => (
    <Box
      sx={{
        flex: 1,
        p: 1.75,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 10px 22px ${alpha(theme.palette.common.black, 0.1)}`,
        },
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" mb={0.5}>
        {icon}
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
        {value}
      </Typography>
    </Box>
  );

  const renderWidgetBody = (id: AdminWidgetId) => {
    switch (id) {
      case 'connection_stats':
        return (
          <Stack spacing={1.25}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {renderMetricTile(
                'Active Users',
                activeUsers,
                <Groups2Outlined color="primary" fontSize="small" />
              )}
              {renderMetricTile(
                'Inactive Users',
                inactiveUsers,
                <WarningAmberOutlined color="warning" fontSize="small" />
              )}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                size="small"
                color={activeRate >= 50 ? 'success' : 'warning'}
                label={`${activeRate}% active`}
              />
              <Typography variant="caption" color="text.secondary">
                Based on {totalUsers} total registered users.
              </Typography>
            </Stack>
          </Stack>
        );
      case 'message_activity':
        return (
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
              )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 60%)`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <ForumOutlined color="primary" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                Active Conversations
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                size="small"
                color={activeConversationMetric > 0 ? 'success' : 'default'}
                label={activeConversationMetric > 0 ? 'Live' : 'Quiet'}
              />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {activeConversationMetric}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Live message sessions and active thread signals.
            </Typography>
          </Box>
        );
      case 'events':
        return (
          <Stack spacing={1.25}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {renderMetricTile(
                'New Users (7d)',
                activity.newUsers ?? 0,
                <Groups2Outlined color="primary" fontSize="small" />
              )}
              {renderMetricTile(
                'Active Sessions (7d)',
                activity.activeSessions ?? 0,
                <ForumOutlined color="success" fontSize="small" />
              )}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {renderMetricTile(
                'New Posts (7d)',
                activity.newPosts ?? 0,
                <AnalyticsOutlined color="primary" fontSize="small" />
              )}
              {renderMetricTile(
                'New Projects (7d)',
                activity.newProjects ?? 0,
                <EventAvailableRounded color="success" fontSize="small" />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {activity.period ?? 'Last 7 days'} platform publishing activity.
            </Typography>
          </Stack>
        );
      case 'leaderboard':
        return (
          <Leaderboard currentUserId={userId} maxItems={8} compact={true} />
        );
      case 'quick_actions':
        return (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AnalyticsOutlined fontSize="small" />}
              onClick={() => onNavigate('/admin/analytics')}
            >
              Analytics
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VerifiedUserOutlined fontSize="small" />}
              onClick={() => onNavigate('/admin/document-verification')}
            >
              Verify Docs
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ReportProblemOutlined fontSize="small" />}
              onClick={() => onNavigate('/admin/reports')}
            >
              Reports
            </Button>
            <IconButton
              aria-label="Refresh admin widgets"
              size="small"
              onClick={() => void loadDashboardData()}
            >
              <RefreshRounded fontSize="small" />
            </IconButton>
          </Stack>
        );
      case 'admin_platform_health':
        return (
          <Stack spacing={1.25}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {renderMetricTile(
                'Failed Logins',
                health.security?.failedLogins ?? 0,
                <ShieldOutlined color="warning" fontSize="small" />
              )}
              {renderMetricTile(
                'Locked Accounts',
                health.security?.lockedAccounts ?? 0,
                <WarningAmberOutlined color="error" fontSize="small" />
              )}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {renderMetricTile(
                'Unverified Emails',
                health.security?.unverifiedEmails ?? 0,
                <VerifiedUserOutlined color="primary" fontSize="small" />
              )}
              {renderMetricTile(
                'Security Events (24h)',
                health.security?.recentSecurityEvents ?? 0,
                <ReportProblemOutlined color="warning" fontSize="small" />
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                color={health.status === 'healthy' ? 'success' : 'warning'}
                label={
                  health.status ? `Status: ${health.status}` : 'Status: N/A'
                }
              />
              <Typography variant="caption" color="text.secondary">
                Updated{' '}
                {health.timestamp
                  ? new Date(health.timestamp).toLocaleTimeString()
                  : 'N/A'}
              </Typography>
            </Stack>
          </Stack>
        );
      case 'admin_moderation_queue':
        return (
          <Stack spacing={1.25}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {renderMetricTile(
                'Pending',
                stats.verifications?.pending ?? 0,
                <PendingActionsRounded color="warning" fontSize="small" />
              )}
              {renderMetricTile(
                'Approved Today',
                stats.verifications?.approvedToday ?? 0,
                <DoneAllRounded color="success" fontSize="small" />
              )}
              {renderMetricTile(
                'Rejected Today',
                stats.verifications?.rejectedToday ?? 0,
                <TaskAltRounded color="error" fontSize="small" />
              )}
            </Stack>
            {(stats.verifications?.pending ?? 0) > 0 ? (
              <Alert severity="info" sx={{ mt: 0.5 }}>
                {stats.verifications?.pending} items are waiting for review.
              </Alert>
            ) : null}
          </Stack>
        );
      case 'admin_platform_totals':
        return (
          <Stack spacing={1.25}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {renderMetricTile(
                'Posts',
                stats.platform?.posts ?? 0,
                <AnalyticsOutlined color="primary" fontSize="small" />
              )}
              {renderMetricTile(
                'Projects',
                stats.platform?.projects ?? 0,
                <EventAvailableRounded color="success" fontSize="small" />
              )}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {renderMetricTile(
                'Referrals',
                stats.platform?.referrals ?? 0,
                <PendingActionsRounded color="warning" fontSize="small" />
              )}
              {renderMetricTile(
                'Mentorships',
                stats.platform?.mentorships ?? 0,
                <DoneAllRounded color="success" fontSize="small" />
              )}
            </Stack>
          </Stack>
        );
      case 'admin_system_alerts':
        return (
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                color={verificationPending > 0 ? 'warning' : 'success'}
                label={
                  verificationPending > 0
                    ? `${verificationPending} pending reviews`
                    : 'No pending reviews'
                }
              />
              <Chip
                size="small"
                color={failedLogins > 20 ? 'error' : 'default'}
                label={`Failed logins: ${failedLogins}`}
              />
              <Chip
                size="small"
                color={lockedAccounts > 0 ? 'error' : 'default'}
                label={`Locked accounts: ${lockedAccounts}`}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Watchlist generated from moderation queue and security telemetry.
            </Typography>
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <Stack spacing={3}>
      {layout
        .filter((item) => item.i in adminWidgetTitles)
        .filter((item) => widgets[item.i]?.visible !== false)
        .map((item) => {
          const widgetId = item.i as AdminWidgetId;
          const body = renderWidgetBody(widgetId);
          const isSelfContained = selfContainedWidgets.has(widgetId);
          const minHeight = Math.max(180, item.h * 80);

          const content =
            !isEditMode && isSelfContained ? (
              <Fragment>{body}</Fragment>
            ) : (
              <Card
                onDragOver={isEditMode ? (e) => e.preventDefault() : undefined}
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
                        {adminWidgetTitles[widgetId]}
                      </Typography>
                    </Stack>
                  ) : null}
                  {loading ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading data...
                    </Typography>
                  ) : (
                    body
                  )}
                  {!loading && loadError && widgetId !== 'leaderboard' ? (
                    <Typography variant="caption" color="error">
                      {loadError}
                    </Typography>
                  ) : null}
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
  );
};

export default AdminDashboardWidgets;
