import { FC } from 'react';
import {
  AccessTime as ClockIcon,
  Done as CheckIcon,
  DoneAll as DoubleCheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Box, Tooltip } from '@mui/material';

export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

interface MessageStatusProps {
  status: MessageStatus;
  timestamp?: string;
  size?: 'small' | 'medium';
}

/**
 * Message Status Indicator Component
 *
 * Shows visual indicators for message delivery status:
 * - Clock: Message is being sent
 * - Single check: Message sent to server
 * - Double check (gray): Message delivered to recipient
 * - Double check (blue): Message read by recipient
 * - Error icon: Message failed to send
 */
const MessageStatus: FC<MessageStatusProps> = ({
  status,
  timestamp,
  size = 'small',
}) => {
  const iconSize = size === 'small' ? 14 : 16;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <Tooltip title="Sending...">
            <ClockIcon
              sx={{
                fontSize: iconSize,
                color: 'text.secondary',
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.5 },
                  '50%': { opacity: 1 },
                },
              }}
            />
          </Tooltip>
        );

      case 'sent':
        return (
          <Tooltip title="Sent">
            <CheckIcon
              sx={{
                fontSize: iconSize,
                color: 'text.secondary',
              }}
            />
          </Tooltip>
        );

      case 'delivered':
        return (
          <Tooltip title="Delivered">
            <DoubleCheckIcon
              sx={{
                fontSize: iconSize,
                color: 'text.secondary',
              }}
            />
          </Tooltip>
        );

      case 'read':
        return (
          <Tooltip
            title={`Read ${timestamp ? `at ${new Date(timestamp).toLocaleTimeString()}` : ''}`}
          >
            <DoubleCheckIcon
              sx={{
                fontSize: iconSize,
                color: 'primary.main',
              }}
            />
          </Tooltip>
        );

      case 'failed':
        return (
          <Tooltip title="Failed to send">
            <ErrorIcon
              sx={{
                fontSize: iconSize,
                color: 'error.main',
              }}
            />
          </Tooltip>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        ml: 0.5,
      }}
    >
      {getStatusIcon()}
    </Box>
  );
};

export default MessageStatus;
