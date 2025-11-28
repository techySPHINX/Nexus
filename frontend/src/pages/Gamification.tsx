import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tab,
  Tabs,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Card,
  CardContent,
  Chip,
  alpha,
  useTheme,
  CircularProgress,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Refresh,
  EmojiEvents,
  TrendingUp,
  History,
  MilitaryTech,
  CalendarMonth,
  Star,
  LocalFireDepartment,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { ProfileNameLink } from '@/utils/ProfileNameLink';
import { Role } from '@/types/profileType';

interface LeaderboardEntry {
  userId: string;
  points: number;
  user?: {
    id: string;
    role: Role;
    name: string;
    profile?: {
      avatarUrl?: string;
    };
  };
  rank?: number;
}

interface Transaction {
  id: string;
  points: number;
  type: string;
  createdAt: string;
  description?: string;
}

const GamificationPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>(
    'week'
  );

  const {
    leaderboard,
    userPoints,
    transactions,
    loading,
    loadLeaderboard,
    loadUserPoints,
    loadTransactions,
    clearCache,
  } = useGamification();

  const loadData = async (showRefresh = false) => {
    if (!user) return;

    try {
      // map local period values to provider period strings
      const periodMap: Record<string, 'day' | 'week' | 'month' | 'all'> = {
        day: 'day',
        week: 'week',
        month: 'month',
        all: 'all',
      };

      const p = periodMap[period];

      await Promise.all([
        loadLeaderboard(p, showRefresh),
        loadUserPoints(user.id, showRefresh),
        loadTransactions(user.id, showRefresh),
      ]);
    } catch (err) {
      console.error('Failed to load gamification data', err);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, user]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
          color: '#FFFFFF',
        };
      case 2:
        return {
          background: `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[600]} 100%)`,
          color: '#FFFFFF',
        };
      case 3:
        return {
          background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: '#FFFFFF',
        };
      default:
        return {
          background:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.default, 0.8),
          color: theme.palette.text.primary,
        };
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <LocalFireDepartment />;
      case 2:
        return <MilitaryTech />;
      case 3:
        return <Star />;
      default:
        return (
          <Typography variant="body2" fontWeight="800">
            {rank}
          </Typography>
        );
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'day':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'all':
        return 'All Time';
      default:
        return period;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography
            variant="h3"
            fontWeight="800"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Leaderboard
          </Typography>
          <Box>
            <IconButton
              onClick={() => loadData(true)}
              disabled={loading}
              sx={{
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.primary.main, 0.05),
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.primary.main, 0.1),
                },
                mr: 1,
              }}
            >
              <Refresh
                sx={{
                  color: theme.palette.primary.main,
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </IconButton>

            <IconButton
              onClick={() => {
                try {
                  clearCache();
                } catch (e) {
                  console.error('Failed to clear gamification cache', e);
                }
                loadData(true);
              }}
              disabled={loading}
              sx={{
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.02)
                    : alpha(theme.palette.primary.main, 0.02),
                '&:hover': {
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.main, 0.06)
                      : alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <History sx={{ color: theme.palette.primary.main }} />
            </IconButton>
          </Box>

          {/* Full-page loading overlay when provider is loading */}
          {loading && (
            <Box
              sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 1400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.background.default, 0.6),
                backdropFilter: 'blur(2px)',
              }}
            >
              <CircularProgress size={64} />
            </Box>
          )}
        </Box>

        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Compete with others and earn recognition for your contributions
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Points Summary Card */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 200,
            }}
          >
            <CardContent
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmojiEvents sx={{ fontSize: 32, mr: 1.5 }} />
                <Typography variant="h6" fontWeight="600">
                  Your Points
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="h1"
                  fontWeight="800"
                  sx={{
                    fontSize: { xs: '4rem', md: '5rem' },
                    textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}
                >
                  {userPoints ?? 0}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                sx={{ opacity: 0.9, textAlign: 'center' }}
              >
                Total points earned
              </Typography>
            </CardContent>

            {/* Background decoration */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
              }}
            />
          </Card>
        </Grid>

        {/* Leaderboard Section */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background:
                theme.palette.mode === 'dark'
                  ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`
                  : '#FFFFFF',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 8px 40px rgba(0, 0, 0, 0.3)'
                  : '0 8px 40px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Tabs Header */}
            <Box
              sx={{
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.4)
                    : alpha(theme.palette.background.default, 0.6),
              }}
            >
              <Tabs
                value={period}
                onChange={(_, v) => setPeriod(v)}
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    minHeight: 60,
                  },
                  '& .Mui-selected': {
                    color: `${theme.palette.primary.main} !important`,
                  },
                }}
                TabIndicatorProps={{
                  style: {
                    backgroundColor: theme.palette.primary.main,
                    height: 3,
                  },
                }}
              >
                <Tab
                  icon={<CalendarMonth sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="Today"
                  value="day"
                />
                <Tab
                  icon={<TrendingUp sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="This Week"
                  value="week"
                />
                <Tab
                  icon={<History sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="This Month"
                  value="month"
                />
                <Tab
                  icon={<MilitaryTech sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label="All Time"
                  value="all"
                />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 0 }}>
              {/* Leaderboard Header */}
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: alpha(theme.palette.primary.main, 0.02),
                }}
              >
                <Typography variant="h6" fontWeight="700" sx={{ flex: 1 }}>
                  Top Contributors - {getPeriodLabel(period)}
                </Typography>
                {/* <Chip
                  label={`${leaderboard.length} users`}
                  size="small"
                  variant="outlined"
                /> */}
              </Box>

              {/* Leaderboard List */}
              <List sx={{ p: 0 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : leaderboard.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography textAlign="center" color="text.secondary">
                          No data available
                        </Typography>
                      }
                    />
                  </ListItem>
                ) : (
                  leaderboard.map((entry: LeaderboardEntry, index: number) => (
                    <ListItem
                      key={entry.userId || index}
                      sx={{
                        py: 2,
                        px: 3,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.03
                          ),
                          transform: 'translateX(4px)',
                        },
                        '&:last-child': {
                          borderBottom: 'none',
                        },
                      }}
                    >
                      {/* Rank Badge */}
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          ...getRankColor(entry.rank || index + 1),
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }}
                      >
                        {getRankIcon(entry.rank || index + 1)}
                      </Box>

                      <ListItemAvatar sx={{ minWidth: 48 }}>
                        <Avatar
                          src={entry.user?.profile?.avatarUrl}
                          sx={{
                            width: 44,
                            height: 44,
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          }}
                          onClick={() => {
                            // Navigate to user profile
                            window.location.href = `/profile/${entry.userId}`;
                          }}
                        >
                          {entry.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <ProfileNameLink
                            user={{
                              id: entry.userId,
                              name: entry.user?.name || 'Anonymous User',
                              role: entry.user?.role || undefined,
                            }}
                            variant="body1"
                            fontWeight={600}
                          />
                        }
                        secondary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mt: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="primary"
                              fontWeight="700"
                              sx={{
                                backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.1
                                ),
                                px: 1.5,
                                py: 0.25,
                                borderRadius: 2,
                                fontSize: '0.8rem',
                              }}
                            >
                              {entry.points} pts
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Card
            sx={{
              borderRadius: 4,
              background:
                theme.palette.mode === 'dark'
                  ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`
                  : '#FFFFFF',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                fontWeight="700"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <History
                  sx={{
                    mr: 1.5,
                    fontSize: 28,
                    color: theme.palette.primary.main,
                  }}
                />
                Recent Transactions
              </Typography>

              <List sx={{ p: 0 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : transactions.length === 0 ? (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography
                          textAlign="center"
                          color="text.secondary"
                          sx={{ py: 2 }}
                        >
                          No recent transactions
                        </Typography>
                      }
                    />
                  </ListItem>
                ) : (
                  transactions.map((transaction: Transaction) => (
                    <ListItem
                      key={transaction.id}
                      sx={{
                        py: 2,
                        px: 2,
                        borderRadius: 3,
                        mb: 1,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.03
                          ),
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                        },
                        '&:last-child': {
                          mb: 0,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          backgroundColor:
                            transaction.points > 0
                              ? alpha(theme.palette.success.main, 0.1)
                              : alpha(theme.palette.error.main, 0.1),
                          color:
                            transaction.points > 0
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                        }}
                      >
                        {transaction.points > 0 ? '+' : ''}
                      </Box>

                      <ListItemText
                        primary={
                          <Typography variant="body1" fontWeight="600">
                            {transaction.type}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {new Date(transaction.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </Typography>
                        }
                      />

                      <Chip
                        label={`${transaction.points > 0 ? '+' : ''}${transaction.points} pts`}
                        color={transaction.points > 0 ? 'success' : 'error'}
                        variant="filled"
                        sx={{
                          fontWeight: 700,
                          minWidth: 80,
                        }}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GamificationPage;
