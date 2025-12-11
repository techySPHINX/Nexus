import { FC, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Skeleton,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
} from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import { useDashboardContext } from '@/contexts/DashBoardContext';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import { useNavigate } from 'react-router-dom';
import { Role } from '@/types/engagement';

interface LeaderboardUser {
  userId: string;
  username: string;
  role: Role;
  totalPoints: number;
  rank: number;
  avatar?: string;
}

interface LeaderboardProps {
  currentUserId?: string;
  maxItems?: number;
  compact?: boolean;
}
type TimePeriod = 'day' | 'week' | 'month';

const Leaderboard: FC<LeaderboardProps> = ({
  currentUserId,
  maxItems = 8,
  compact = true,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const { getLeaderboard } = useDashboardContext();
  const [isListLoading, setIsListLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('day');

  const fetchLeaderboard = useCallback(
    async (period: TimePeriod = 'day') => {
      try {
        setIsListLoading(true);
        if (!getLeaderboard) {
          console.warn('DashboardContext.getLeaderboard not available');
          setLeaderboard([]);
          return;
        }
        const data = await getLeaderboard(
          period === 'day' ? 'day' : period === 'week' ? 'weekly' : 'monthly',
          maxItems
        );
        type UserObj = {
          name?: string;
          displayName?: string;
          role?: Role;
          profile?: { avatarUrl?: string };
          avatarUrl?: string;
        };

        const entries =
          (data as unknown as Array<Record<string, unknown>>) || [];
        const mapped = entries.map((e, idx) => {
          const userId = (e.userId as string) || (e.id as string) || '';
          const userObj = (e.user as unknown as UserObj) || {};

          const username =
            (userObj.name as string | undefined) ||
            (userObj.displayName as string | undefined) ||
            userId ||
            'Anonymous';
          const userRole = userObj.role as Role;

          const totalPoints =
            (e.points as number) || (e.totalPoints as number) || 0;
          const rank = (e.rank as number) || idx + 1;
          const avatar =
            (userObj.profile?.avatarUrl as string | undefined) ||
            (userObj.avatarUrl as string | undefined) ||
            undefined;
          return {
            userId,
            username,
            role: userRole,
            totalPoints,
            rank,
            avatar,
          } as LeaderboardUser;
        });

        setLeaderboard(mapped);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsListLoading(false);
      }
    },
    [maxItems, getLeaderboard]
  );

  useEffect(() => {
    // only reload leaderboard entries when timePeriod changes
    fetchLeaderboard(timePeriod);
  }, [timePeriod, fetchLeaderboard]);

  const handleTimePeriodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPeriod: TimePeriod | null
  ) => {
    if (newPeriod !== null) {
      setTimePeriod(newPeriod);
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return `linear-gradient(135deg, ${alpha('#FFD700', 0.1)} 0%, ${alpha('#FFD700', 0.05)} 100%)`;
      case 2:
        return `linear-gradient(135deg, ${alpha('#C0C0C0', 0.1)} 0%, ${alpha('#C0C0C0', 0.05)} 100%)`;
      case 3:
        return `linear-gradient(135deg, ${alpha('#CD7F32', 0.1)} 0%, ${alpha('#CD7F32', 0.05)} 100%)`;
      default:
        return 'transparent';
    }
  };

  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
  };

  // Render the full component; show skeleton only for the leaderboard list
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      {/* Header: match other dashboard headers */}
      <Box
        sx={{
          p: compact ? 1.5 : 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp
            sx={{
              fontSize: compact ? '18px' : '20px',
              color: theme.palette.text.primary,
            }}
          />
          <Typography
            variant={compact ? 'subtitle2' : 'h6'}
            sx={{ fontWeight: 700, color: theme.palette.text.primary }}
          >
            Leaderboard
          </Typography>
        </Box>

        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={() => fetchLeaderboard(timePeriod)}
              sx={{ color: theme.palette.text.primary }}
            >
              <Refresh sx={{ fontSize: compact ? '16px' : '18px' }} />
            </IconButton>
          </Tooltip>
        </Box> */}
      </Box>

      {/* Time Period Selector */}
      <Box sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <ToggleButtonGroup
          value={timePeriod}
          exclusive
          onChange={handleTimePeriodChange}
          size="small"
          fullWidth
          sx={{
            '& .MuiToggleButton-root': {
              py: 0.5,
              px: 1,
              fontSize: '0.75rem',
              textTransform: 'none',
              border: `1px solid ${theme.palette.divider}`,
              '&.Mui-selected': {
                bgcolor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                },
              },
            },
          }}
        >
          <ToggleButton value="day">Today</ToggleButton>
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="month">This Month</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Leaderboard List */}
      <List dense={compact} sx={{ p: compact ? 0.5 : 1 }}>
        {isListLoading ? (
          // Render skeletons just for the list while leaderboard loads
          Array.from({ length: maxItems }).map((_, index) => (
            <ListItem key={`skeleton-${index}`}>
              <ListItemIcon sx={{ minWidth: compact ? 28 : 32 }}>
                <Skeleton variant="circular" width={32} height={32} />
              </ListItemIcon>
              <ListItemText
                primary={<Skeleton variant="text" width="40%" />}
                secondary={<Skeleton variant="text" width="25%" />}
              />
              <Skeleton variant="text" width={40} />
            </ListItem>
          ))
        ) : leaderboard.length === 0 ? (
          <ListItem>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ py: 2 }}
                >
                  No leaderboard data available
                </Typography>
              }
            />
          </ListItem>
        ) : (
          leaderboard.map((user) => (
            <ListItem
              key={user.userId}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                bgcolor:
                  user.userId === currentUserId
                    ? alpha(theme.palette.primary.main, 0.08)
                    : getRankBackground(user.rank),
                border:
                  user.userId === currentUserId
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    : '1px solid transparent',
                '&:hover': {
                  bgcolor:
                    user.userId === currentUserId
                      ? alpha(theme.palette.primary.main, 0.12)
                      : theme.palette.action.hover,
                },
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Rank */}
              <ListItemIcon sx={{ minWidth: compact ? 28 : 32 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    variant={compact ? 'caption' : 'body2'}
                    sx={{
                      fontWeight: 600,
                      minWidth: 20,
                      textAlign: 'center',
                      color:
                        user.rank <= 3
                          ? theme.palette.primary.main
                          : 'text.secondary',
                    }}
                  >
                    {user.rank}
                  </Typography>
                </Box>
              </ListItemIcon>

              {/* Avatar */}
              <Avatar
                src={user.avatar}
                sx={{
                  width: compact ? 28 : 32,
                  height: compact ? 28 : 32,
                  mr: 1.5,
                  bgcolor: theme.palette.primary.main,
                  fontSize: compact ? '0.75rem' : '0.875rem',
                }}
              >
                {user.username.charAt(0).toUpperCase()}
              </Avatar>

              {/* User Info */}
              <ListItemText
                primary={
                  <Typography
                    variant={compact ? 'caption' : 'body2'}
                    sx={{
                      fontWeight: user.userId === currentUserId ? 600 : 500,
                      lineHeight: 1.2,
                      color:
                        user.userId === currentUserId
                          ? theme.palette.primary.main
                          : 'text.primary',
                    }}
                  >
                    <ProfileNameLink
                      user={{
                        id: user.userId,
                        name: user.username,
                        role: user.role,
                      }}
                      showRoleBadge={true}
                      showYouBadge={false}
                      fontSize={compact ? '0.75rem' : '0.875rem'}
                      badgeSize={10}
                    />
                  </Typography>
                }
                secondary={
                  !compact && (
                    <Typography variant="caption" color="text.secondary">
                      {user.totalPoints.toLocaleString()} points
                    </Typography>
                  )
                }
                sx={{
                  my: compact ? 0.25 : 0.5,
                  '& .MuiListItemText-primary': {
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
              />

              {/* Points */}
              <Chip
                label={formatPoints(user.totalPoints)}
                size="small"
                variant="filled"
                sx={{
                  bgcolor:
                    user.rank <= 3
                      ? alpha(theme.palette.primary.main, 0.9)
                      : theme.palette.grey[300],
                  color: user.rank <= 3 ? 'white' : theme.palette.grey[800],
                  fontWeight: 600,
                  fontSize: compact ? '0.65rem' : '0.75rem',
                  height: compact ? 20 : 24,
                  minWidth: compact ? 45 : 50,
                  '& .MuiChip-label': {
                    px: compact ? 1 : 1.5,
                  },
                }}
              />
            </ListItem>
          ))
        )}
      </List>

      {compact && leaderboard.length > 0 && (
        <Box
          sx={{
            p: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' },
            }}
            onClick={() => {
              navigate('/gamification');
            }}
          >
            View Full Leaderboard
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Leaderboard;
