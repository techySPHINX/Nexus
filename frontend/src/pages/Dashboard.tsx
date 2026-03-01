import { FC, useEffect, useMemo, useRef, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Chip,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Stack,
} from '@mui/material';
import {
  Message,
  EditRounded,
  DoneRounded,
  Settings,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardContext } from '@/contexts/DashBoardContext';
import { useNotification } from '@/contexts/NotificationContext';
import { apiService } from '../services/api';
import { improvedWebSocketService } from '../services/websocket.improved';
import type { WebSocketMessage } from '../services/websocket.improved';
import type { DashboardLayoutItem } from '@/services/DashBoardService';

import HeroWelcomeCard from '../components/DashBoard/HeroWelcomeCard';
import NotificationIndicator from '@/components/Notification/NotificationIndicator';
import ThemeToggle from '@/components/ThemeToggle';
import { useNavigate } from 'react-router-dom';
import StudentDashboardWidgets, {
  studentWidgetTitles,
} from '@/components/DashBoard/Components/StudentDashboardWidgets';
import AlumniDashboardWidgets, {
  alumniWidgetTitles,
} from '@/components/DashBoard/Components/AlumniDashboardWidgets';
import AdminDashboardWidgets, {
  adminWidgetTitles,
} from '@/components/DashBoard/Components/AdminDashboardWidgets';

type DashboardPreset = 'STUDENT' | 'ALUM' | 'ADMIN';
type DashboardColumn = 'left' | 'right';
type WidgetConfig = { visible: boolean; settings?: Record<string, unknown> };
type DashboardColumns = Record<DashboardColumn, DashboardLayoutItem[]>;

const widgetTitlesByPreset = {
  STUDENT: studentWidgetTitles,
  ALUM: alumniWidgetTitles,
  ADMIN: adminWidgetTitles,
} as const;

const defaultWidgetIdsByPreset: Record<
  DashboardPreset,
  Record<DashboardColumn, string[]>
> = {
  STUDENT: {
    left: [
      'connection_stats',
      'student_network_goal',
      'message_activity',
      'community',
      'referrals',
    ],
    right: [
      'profile',
      'recommended_connection',
      'events',
      'student_activity_pulse',
      'quick_actions',
      'leaderboard',
    ],
  },
  ALUM: {
    left: [
      'connection_stats',
      'alumni_growth_goal',
      'alumni_post_engagement',
      'community',
      'referrals',
    ],
    right: [
      'message_activity',
      'alumni_influence',
      'recommended_connection',
      'events',
      'quick_actions',
      'leaderboard',
    ],
  },
  ADMIN: {
    left: [
      'admin_platform_health',
      'admin_system_alerts',
      'admin_moderation_queue',
      'message_activity',
      'events',
    ],
    right: [
      'connection_stats',
      'admin_platform_totals',
      'quick_actions',
      'leaderboard',
    ],
  },
};

const starterWidgetIdsByPreset: Record<
  Exclude<DashboardPreset, 'ADMIN'>,
  Record<DashboardColumn, string[]>
> = {
  STUDENT: {
    left: ['community', 'referrals'],
    right: ['profile', 'recommended_connection', 'events', 'leaderboard'],
  },
  ALUM: {
    left: ['community', 'referrals'],
    right: ['profile', 'recommended_connection', 'events', 'leaderboard'],
  },
};

const hiddenForNewUsers = new Set(['connection_stats', 'message_activity']);

const defaultWidgets: Record<string, WidgetConfig> = {
  connection_stats: { visible: true },
  message_activity: { visible: true },
  profile: { visible: true },
  recommended_connection: { visible: true },
  community: { visible: true },
  referrals: { visible: true },
  events: { visible: true },
  leaderboard: { visible: true },
  quick_actions: { visible: true },
  alumni_post_engagement: { visible: true },
  alumni_growth_goal: { visible: true },
  alumni_influence: { visible: true },
  student_network_goal: { visible: true },
  student_activity_pulse: { visible: true },
  admin_platform_health: { visible: true },
  admin_moderation_queue: { visible: true },
  admin_platform_totals: { visible: true },
  admin_system_alerts: { visible: true },
};

const toLayoutItems = (ids: string[]): DashboardLayoutItem[] =>
  ids.map((id, index) => ({
    i: id,
    x: 0,
    y: index,
    w: 12,
    h: 3,
  }));

const getDefaultColumnsForPreset = (
  preset: DashboardPreset
): DashboardColumns => ({
  left: toLayoutItems(defaultWidgetIdsByPreset[preset].left),
  right: toLayoutItems(defaultWidgetIdsByPreset[preset].right),
});

const getStarterColumnsForPreset = (
  preset: DashboardPreset
): DashboardColumns => {
  if (preset === 'ADMIN') return getDefaultColumnsForPreset('ADMIN');

  return {
    left: toLayoutItems(starterWidgetIdsByPreset[preset].left),
    right: toLayoutItems(starterWidgetIdsByPreset[preset].right),
  };
};

const Dashboard: FC = () => {
  const { user, token } = useAuth();
  const { connectionStats, profileCompletionStats } = useDashboardContext();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);
  const navigate = useNavigate();

  const [stats, setStats] = useState({ messages: 0, pendingRequests: 0 });
  const [progress, setProgress] = useState(0);
  const [openSettings, setOpenSettings] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [columns, setColumns] = useState<DashboardColumns>(
    getDefaultColumnsForPreset('STUDENT')
  );
  const [widgets, setWidgets] =
    useState<Record<string, WidgetConfig>>(defaultWidgets);
  const [isPrefsHydrated, setIsPrefsHydrated] = useState(false);
  const dragWidgetRef = useRef<{ column: DashboardColumn; id: string } | null>(
    null
  );

  const activePreset: DashboardPreset =
    user?.role === 'ADMIN'
      ? 'ADMIN'
      : user?.role === 'ALUM'
        ? 'ALUM'
        : 'STUDENT';
  const isNewUser =
    activePreset !== 'ADMIN' && user?.profileCompleted === false;
  const activeWidgetTitles = widgetTitlesByPreset[activePreset];
  const activeWidgetIds = useMemo(() => {
    const ids = Object.keys(activeWidgetTitles);
    if (!isNewUser) return ids;

    const starter = [
      ...starterWidgetIdsByPreset[activePreset].left,
      ...starterWidgetIdsByPreset[activePreset].right,
    ];
    const starterSet = new Set(starter);
    return ids.filter((id) => starterSet.has(id));
  }, [activePreset, activeWidgetTitles, isNewUser]);
  const activeWidgetIdSet = useMemo(
    () => new Set(activeWidgetIds),
    [activeWidgetIds]
  );

  const fallbackSkills = [
    'Leadership',
    'UI/UX',
    'TypeScript',
    'Node.js',
    'React',
    'SQL',
    'APIs',
    'Testing',
    'Writing',
    'Community',
  ].map((name, idx) => ({ id: `fallback-${idx}`, name }));

  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  useEffect(() => {
    if (!isEditMode) setOpenSettings(false);
  }, [isEditMode]);

  useEffect(() => {
    const target = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          profileCompletionStats?.completionPercentage ??
            connectionStats?.recent30Days ??
            0
        )
      )
    );
    const timer = setTimeout(() => setProgress(target), 250);
    return () => clearTimeout(timer);
  }, [
    profileCompletionStats?.completionPercentage,
    connectionStats?.recent30Days,
  ]);

  useEffect(() => {
    setIsPrefsHydrated(false);
    const baseWidgets = { ...defaultWidgets };
    const defaultColumns = isNewUser
      ? getStarterColumnsForPreset(activePreset)
      : getDefaultColumnsForPreset(activePreset);
    const allowedWidgetIds = new Set(activeWidgetIds);

    Object.keys(activeWidgetTitles).forEach((id) => {
      baseWidgets[id] = {
        ...(baseWidgets[id] ?? { visible: true }),
        visible: allowedWidgetIds.has(id),
      };
    });

    if (!user?.id) {
      setWidgets(baseWidgets);
      setColumns(defaultColumns);
      setIsPrefsHydrated(true);
      return;
    }

    if (isNewUser) {
      setWidgets(baseWidgets);
      setColumns(defaultColumns);
      setIsPrefsHydrated(true);
      return;
    }

    const widgetsStorageKey = `nexus:dashboard:widgets:${user.id}:${activePreset}`;
    const columnsStorageKey = `nexus:dashboard:columns:${user.id}:${activePreset}`;

    try {
      const storedWidgets = localStorage.getItem(widgetsStorageKey);
      if (storedWidgets) {
        const parsed = JSON.parse(storedWidgets) as Record<string, unknown>;
        activeWidgetIds.forEach((id) => {
          const value = parsed?.[id];
          if (typeof value === 'boolean') {
            baseWidgets[id] = { ...baseWidgets[id], visible: value };
          }
        });
      }
    } catch {
      // noop
    }

    const normalizeColumn = (
      candidate: unknown,
      fallbackIds: string[],
      usedIds: Set<string>
    ): string[] => {
      const ids: string[] = [];
      if (Array.isArray(candidate)) {
        candidate.forEach((entry) => {
          if (typeof entry !== 'string') return;
          if (!activeWidgetIds.includes(entry)) return;
          if (usedIds.has(entry)) return;
          usedIds.add(entry);
          ids.push(entry);
        });
      }
      fallbackIds.forEach((id) => {
        if (usedIds.has(id)) return;
        usedIds.add(id);
        ids.push(id);
      });
      return ids;
    };

    try {
      const storedColumns = localStorage.getItem(columnsStorageKey);
      if (storedColumns) {
        const parsed = JSON.parse(storedColumns) as {
          left?: unknown;
          right?: unknown;
        };
        const usedIds = new Set<string>();
        const leftIds = normalizeColumn(
          parsed?.left,
          defaultWidgetIdsByPreset[activePreset].left,
          usedIds
        );
        const rightIds = normalizeColumn(
          parsed?.right,
          defaultWidgetIdsByPreset[activePreset].right,
          usedIds
        );
        const nextColumns = {
          left: toLayoutItems(leftIds),
          right: toLayoutItems(rightIds),
        };
        setColumns(nextColumns);
      } else {
        setColumns(defaultColumns);
      }
    } catch {
      setColumns(defaultColumns);
    }

    setWidgets(baseWidgets);
    setIsPrefsHydrated(true);
  }, [activePreset, activeWidgetIds, activeWidgetTitles, isNewUser, user?.id]);

  useEffect(() => {
    if (!user?.id || !isPrefsHydrated) return;
    const widgetsStorageKey = `nexus:dashboard:widgets:${user.id}:${activePreset}`;
    const columnsStorageKey = `nexus:dashboard:columns:${user.id}:${activePreset}`;

    const visibilityPayload = activeWidgetIds.reduce<Record<string, boolean>>(
      (acc, id) => {
        acc[id] = widgets[id]?.visible !== false;
        return acc;
      },
      {}
    );

    const columnsPayload = {
      left: columns.left.map((item) => item.i),
      right: columns.right.map((item) => item.i),
    };

    localStorage.setItem(widgetsStorageKey, JSON.stringify(visibilityPayload));
    localStorage.setItem(columnsStorageKey, JSON.stringify(columnsPayload));
  }, [
    activePreset,
    activeWidgetIds,
    columns,
    isPrefsHydrated,
    user?.id,
    widgets,
  ]);

  const fetchMessageCount = async () => {
    try {
      const response = await apiService.messages.getAllConversations();
      if (response?.data) {
        let totalMessages = 0;
        (response.data as Array<{ latestMessage?: unknown }>).forEach(
          (conv) => {
            if (conv.latestMessage) totalMessages++;
          }
        );
        setStats((prev) => ({ ...prev, messages: totalMessages }));
      }
    } catch {
      // noop
    }
  };

  useEffect(() => {
    if (!user?.id || !token) {
      navigate('/login');
      return;
    }

    const handleNewMessage = (message: WebSocketMessage) => {
      const newMessage = message.data as {
        sender?: { name?: string };
        receiverId: string;
      };
      if (newMessage.receiverId === user.id) {
        setStats((prev) => ({ ...prev, messages: prev.messages + 1 }));
        showNotificationRef.current?.(
          `${newMessage.sender?.name || 'Someone'} sent you a message`,
          'info'
        );
      }
    };

    const handleConnectionRequest = (message: WebSocketMessage) => {
      const data = message.data as {
        sender?: { name?: string };
      };
      showNotificationRef.current?.(
        `${data.sender?.name || 'Someone'} wants to connect with you`,
        'info'
      );
      setStats((prev) => ({
        ...prev,
        pendingRequests: prev.pendingRequests + 1,
      }));
    };

    const init = async () => {
      try {
        await fetchMessageCount();
      } catch {
        // noop
      }

      try {
        await improvedWebSocketService.connect(user.id, token);
        improvedWebSocketService.on('NEW_MESSAGE', handleNewMessage);
        improvedWebSocketService.on(
          'CONNECTION_REQUEST',
          handleConnectionRequest
        );
      } catch (error) {
        console.error('Failed to initialize WebSocket for dashboard:', error);
      }
    };

    void init();

    return () => {
      improvedWebSocketService.off('NEW_MESSAGE');
      improvedWebSocketService.off('CONNECTION_REQUEST');
    };
  }, [user?.id, token, navigate]);

  const displayedSkills = (
    user?.profile?.skills && user.profile.skills.length > 0
      ? user.profile.skills
      : fallbackSkills
  ).slice(0, 10);

  const moveWithinColumn = (
    column: DashboardColumn,
    fromId: string,
    toId: string
  ) => {
    if (fromId === toId) return;
    setColumns((prev) => {
      const current = [...prev[column]];
      const fromIndex = current.findIndex((item) => item.i === fromId);
      const toIndex = current.findIndex((item) => item.i === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);

      return {
        ...prev,
        [column]: current.map((item, index) => ({ ...item, y: index })),
      };
    });
  };

  const handleDrop = (column: DashboardColumn, targetId: string) => {
    if (!isEditMode) return;
    const drag = dragWidgetRef.current;
    if (!drag) return;
    if (drag.column !== column) {
      dragWidgetRef.current = null;
      return;
    }
    moveWithinColumn(column, drag.id, targetId);
    dragWidgetRef.current = null;
  };

  const renderColumnWidgets = (column: DashboardColumn) => {
    const pendingRequestCount = Math.max(
      stats.pendingRequests,
      connectionStats?.pendingReceived ?? 0
    );
    const totalConnections = connectionStats?.total ?? 0;
    const recentConnections = connectionStats?.recent30Days ?? 0;
    const commonProps = {
      column,
      isEditMode,
      layout: columns[column],
      widgets,
      userId: user?.id,
      statsMessages: stats.messages,
      statsPendingRequests: pendingRequestCount,
      onDragStart: (dragColumn: DashboardColumn, id: string) => {
        if (!isEditMode) return;
        dragWidgetRef.current = { column: dragColumn, id };
      },
      onDrop: handleDrop,
      onNavigate: navigate,
    };

    if (activePreset === 'ADMIN') {
      return <AdminDashboardWidgets {...commonProps} />;
    }
    if (activePreset === 'ALUM') {
      return (
        <AlumniDashboardWidgets
          {...commonProps}
          statsConnectionsTotal={totalConnections}
          statsRecentConnections={recentConnections}
        />
      );
    }
    return (
      <StudentDashboardWidgets
        {...commonProps}
        statsConnectionsTotal={totalConnections}
        statsRecentConnections={recentConnections}
      />
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: 'wrap',
          gap: 2,
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: (theme) =>
            `0 10px 26px ${alpha(theme.palette.common.black, 0.08)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: '50%',
            top: -120,
            right: -90,
          },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
            }}
          >
            Your Nexus Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track your progress and stay connected
          </Typography>
        </Box>

        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
          }}
        >
          <Chip
            icon={<Message sx={{ fontSize: 16 }} />}
            label={`${stats.messages} Messages`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{
              py: 1.8,
              px: 0.5,
              fontWeight: 400,
            }}
          />
          {isNewUser ? (
            <Chip
              label="Starter Layout"
              color="success"
              size="small"
              sx={{ fontWeight: 400 }}
            />
          ) : null}
          <Button
            size="small"
            startIcon={
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: isEditMode
                    ? 'success.main'
                    : 'action.disabled',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {isEditMode ? (
                  <DoneRounded sx={{ fontSize: 12, color: 'white' }} />
                ) : (
                  <EditRounded sx={{ fontSize: 12, color: 'white' }} />
                )}
              </Box>
            }
            variant="contained"
            disableElevation
            onClick={() => setIsEditMode((prev) => !prev)}
            sx={{
              textTransform: 'none',
              fontWeight: 400,
              borderRadius: '20px',
              px: 1.6,
              py: 0.5,
              backgroundColor: isEditMode
                ? 'success.light'
                : 'action.disabledBackground',
              color: isEditMode ? 'white' : 'text.disabled',
              '&:hover': {
                backgroundColor: isEditMode
                  ? 'success.main'
                  : 'action.disabled',
              },
            }}
          >
            {isEditMode ? 'Edit Mode' : 'View Mode'}
          </Button>
          <ThemeToggle />
          <NotificationIndicator />
        </Box>
      </Box>

      <HeroWelcomeCard
        user={user ?? undefined}
        progress={progress}
        displayedSkills={displayedSkills}
      />

      {isEditMode ? (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2.5,
            border: '1px dashed',
            borderColor: 'divider',
            background: (theme) =>
              `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.08
              )} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Add or remove blocks
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Drag widgets within each column and control visibility here.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Settings fontSize="small" />}
              onClick={() => setOpenSettings(true)}
            >
              Manage Blocks
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid item xs={12} lg={8}>
          {renderColumnWidgets('left')}
        </Grid>
        <Grid item xs={12} lg={4}>
          {renderColumnWidgets('right')}
        </Grid>
      </Grid>

      <Dialog
        open={openSettings}
        onClose={() => setOpenSettings(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Dashboard Widgets</DialogTitle>
        <DialogContent>
          <Stack>
            {Object.entries(activeWidgetTitles)
              .filter(([id]) => activeWidgetIdSet.has(id))
              .filter(([id]) => (isNewUser ? !hiddenForNewUsers.has(id) : true))
              .map(([id, label]) => (
                <FormControlLabel
                  key={id}
                  control={
                    <Switch
                      checked={widgets[id]?.visible !== false}
                      onChange={(event) =>
                        setWidgets((prev) => ({
                          ...prev,
                          [id]: {
                            ...prev[id],
                            visible: event.target.checked,
                          },
                        }))
                      }
                    />
                  }
                  label={label}
                />
              ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSettings(false)}>Done</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
