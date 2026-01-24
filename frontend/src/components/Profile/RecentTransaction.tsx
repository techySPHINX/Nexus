import { FC, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  Refresh,
  EmojiEvents,
  Quiz,
  Assignment,
} from '@mui/icons-material';
import { useProfile } from '@/contexts/ProfileContext';

interface Transaction {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
  entityId?: string;
}

interface RecentTransactionsProps {
  userId: string;
  maxItems?: number;
  compact?: boolean;
}

const RecentTransactions: FC<RecentTransactionsProps> = ({
  userId,
  maxItems = 5,
  compact = true,
}) => {
  const theme = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { getUserTransactions } = useProfile();

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      // Use profile context helper to fetch transactions
      const data = await getUserTransactions?.(userId, maxItems);
      setTransactions((data as unknown as Transaction[]) || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, maxItems, getUserTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [userId, maxItems, fetchTransactions]);

  const getTransactionIcon = (type: string) => {
    const iconStyle = { fontSize: compact ? '16px' : '20px' };

    switch (type) {
      case 'quiz_completed':
        return <Quiz sx={iconStyle} />;
      case 'assignment_submitted':
        return <Assignment sx={iconStyle} />;
      case 'achievement_unlocked':
        return <EmojiEvents sx={iconStyle} />;
      default:
        return <TrendingUp sx={iconStyle} />;
    }
  };

  const getTransactionColor = (points: number) => {
    return points > 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  const formatPoints = (points: number) => {
    return `${points > 0 ? '+' : ''}${points}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: compact ? 1 : 2 }}>
        {Array.from({ length: maxItems }).map((_, index) => (
          <Box
            key={index}
            sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}
          >
            <Skeleton
              variant="circular"
              width={24}
              height={24}
              sx={{ mr: 1.5 }}
            />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="60%" height={16} />
              <Skeleton variant="text" width="40%" height={12} />
            </Box>
            <Skeleton variant="text" width={40} height={16} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: compact ? 1.5 : 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.primary.main,
          color: 'white',
        }}
      >
        <Typography
          variant={compact ? 'subtitle2' : 'h6'}
          sx={{
            fontWeight: 600,
            color: 'white',
          }}
        >
          Recent Activity
        </Typography>
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={fetchTransactions}
            sx={{ color: 'white' }}
          >
            <Refresh sx={{ fontSize: compact ? '16px' : '20px' }} />
          </IconButton>
        </Tooltip>
      </Box>

      <List dense={compact} sx={{ p: compact ? 0.5 : 1 }}>
        {transactions.length === 0 ? (
          <ListItem>
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ py: 2 }}
                >
                  No recent activity
                </Typography>
              }
            />
          </ListItem>
        ) : (
          transactions.map((transaction) => (
            <ListItem
              key={transaction.id}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
                transition: 'background-color 0.2s ease',
              }}
            >
              <ListItemIcon sx={{ minWidth: compact ? 32 : 40 }}>
                <Box
                  sx={{
                    color: getTransactionColor(transaction.points),
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {getTransactionIcon(transaction.type)}
                </Box>
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography
                    variant={compact ? 'caption' : 'body2'}
                    sx={{
                      fontWeight: 500,
                      lineHeight: 1.2,
                    }}
                  >
                    {transaction.description}
                  </Typography>
                }
                secondary={
                  compact ? null : (
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(transaction.createdAt)}
                    </Typography>
                  )
                }
                sx={{
                  my: compact ? 0.25 : 0.5,
                  '& .MuiListItemText-primary': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {!compact && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ minWidth: 60, textAlign: 'right' }}
                  >
                    {formatDate(transaction.createdAt)}
                  </Typography>
                )}
                <Chip
                  label={formatPoints(transaction.points)}
                  size="small"
                  variant="filled"
                  sx={{
                    bgcolor: getTransactionColor(transaction.points),
                    color: 'white',
                    fontWeight: 600,
                    fontSize: compact ? '0.65rem' : '0.75rem',
                    height: compact ? 20 : 24,
                    minWidth: compact ? 45 : 50,
                    '& .MuiChip-label': {
                      px: compact ? 1 : 1.5,
                    },
                  }}
                />
              </Box>
            </ListItem>
          ))
        )}
      </List>

      {compact && transactions.length > 0 && (
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
            sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
            onClick={() => {
              /* Navigate to full transactions page */
            }}
          >
            View All Activity
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RecentTransactions;
