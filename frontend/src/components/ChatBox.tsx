import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
  Badge,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  createdAt: string;
  isRead?: boolean;
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
}

interface ChatBoxProps {
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  isTyping?: boolean;
  typingUsers: Set<string>;
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onlineUsers?: Set<string>;
}

/**
 * ChatBox Component
 *
 * Features:
 * - Displays selected conversation
 * - Shows message list and input
 * - Handles typing indicators
 * - Responsive design
 */
const ChatBox: React.FC<ChatBoxProps> = ({
  conversation,
  messages,
  onSendMessage,
  onTyping,
  isTyping,
  typingUsers,
  loading,
  messagesEndRef,
  onEditMessage,
  onDeleteMessage,
  onlineUsers,
}) => {
  if (!conversation) {
    return (
      <Card sx={{ height: '70vh', overflow: 'hidden' }}>
        <CardContent
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'grey.50',
          }}
        >
          <PersonIcon
            sx={{ fontSize: 64, mb: 2, opacity: 0.5, color: 'text.secondary' }}
          />
          <Typography variant="h6" gutterBottom color="text.secondary">
            Select a conversation
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary">
            Choose a conversation from the list to start messaging
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '70vh', overflow: 'hidden' }}>
      <CardContent
        sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Chat Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: 'background.paper',
          }}
        >
          {/* ===== Avatar with Online/Offline Badge (Todo #10) ===== */}
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-dot': {
                backgroundColor: onlineUsers?.has(conversation.otherUser.id)
                  ? 'success.main'
                  : 'grey.400',
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '2px solid white',
              },
            }}
          >
            <Avatar
              src={conversation.otherUser.profilePicture}
              alt={conversation.otherUser.name}
              sx={{ width: 40, height: 40 }}
            >
              {conversation.otherUser.name.charAt(0)}
            </Avatar>
          </Badge>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {conversation.otherUser.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {conversation.otherUser.email}
            </Typography>
          </Box>

          {/* Typing Indicator */}
          {isTyping && typingUsers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Typography
                variant="body2"
                color="primary.main"
                sx={{ fontStyle: 'italic' }}
              >
                {Array.from(typingUsers)
                  .map((userId) =>
                    conversation.otherUser.id === userId
                      ? conversation.otherUser.name
                      : userId
                  )
                  .join(', ')}{' '}
                typing...
              </Typography>
            </motion.div>
          )}
        </Box>

        {/* Messages Area */}
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100%"
            >
              <CircularProgress />
            </Box>
          ) : (
            <MessageList
              messages={messages}
              conversation={conversation}
              messagesEndRef={messagesEndRef}
              onEditMessage={onEditMessage}
              onDeleteMessage={onDeleteMessage}
            />
          )}
        </Box>

        <Divider />

        {/* Message Input */}
        <Box sx={{ p: 2 }}>
          <MessageInput
            onSendMessage={onSendMessage}
            onTyping={onTyping}
            disabled={loading}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChatBox;
