import {
  useState,
  useRef,
  KeyboardEvent,
  FC,
  ChangeEvent,
  useCallback,
} from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

/**
 * MessageInput Component
 *
 * Features:
 * - Text input with emoji support
 * - Send button with loading state
 * - Typing indicators
 * - File attachment placeholder
 * - Auto-resize textarea
 * - Keyboard shortcuts (Enter to send, Shift+Enter for new line)
 */
const MessageInput: FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textFieldRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  /**
   * Handle message input change
   */
  const handleMessageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setMessage(value);

      // Handle typing indicator
      if (value.trim() && !isTyping) {
        setIsTyping(true);
        onTyping(true);
      } else if (!value.trim() && isTyping) {
        setIsTyping(false);
        onTyping(false);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator
      if (value.trim()) {
        typingTimeoutRef.current = window.setTimeout(() => {
          setIsTyping(false);
          onTyping(false);
        }, 2000);
      }
    },
    [isTyping, onTyping]
  );

  /**
   * Handle sending message
   */
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() || isSending || disabled) return;

    const messageContent = message.trim();
    setMessage('');
    setIsSending(true);
    setIsTyping(false);
    onTyping(false);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      await onSendMessage(messageContent);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Restore message on error
      setMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  }, [message, isSending, disabled, onSendMessage, onTyping]);

  /**
   * Handle keyboard events
   */
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  /**
   * Handle emoji button click
   */
  const handleEmojiClick = useCallback(() => {
    // Focus on text field
    if (textFieldRef.current) {
      textFieldRef.current.focus();
    }

    // Add emoji placeholder (in a real app, you'd open an emoji picker)
    const emoji = '😊';
    setMessage((prev) => prev + emoji);
  }, []);

  /**
   * Handle file attachment
   */
  const handleFileAttachment = useCallback(() => {
    // Placeholder for file attachment functionality
    console.log('File attachment clicked');
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        p: 1,
        backgroundColor: 'background.paper',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
      }}
    >
      {/* File Attachment Button */}
      <Tooltip title="Attach file">
        <IconButton
          onClick={handleFileAttachment}
          disabled={disabled}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <AttachFileIcon />
        </IconButton>
      </Tooltip>

      {/* Message Input */}
      <TextField
        ref={textFieldRef}
        value={message}
        onChange={handleMessageChange}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        multiline
        maxRows={4}
        disabled={disabled}
        sx={{
          flex: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.default',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            '&.Mui-focused': {
              backgroundColor: 'background.paper',
            },
          },
          '& .MuiInputBase-input': {
            padding: '12px 16px',
            fontSize: '0.95rem',
            lineHeight: 1.4,
          },
        }}
        InputProps={{
          disableUnderline: true,
        }}
      />

      {/* Emoji Button */}
      <Tooltip title="Add emoji">
        <IconButton
          onClick={handleEmojiClick}
          disabled={disabled}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <EmojiIcon />
        </IconButton>
      </Tooltip>

      {/* Send Button */}
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Tooltip title="Send message">
          <IconButton
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending || disabled}
            sx={{
              backgroundColor: message.trim() ? 'primary.main' : 'grey.300',
              color: message.trim() ? 'primary.contrastText' : 'text.disabled',
              width: 48,
              height: 48,
              '&:hover': {
                backgroundColor: message.trim() ? 'primary.dark' : 'grey.400',
              },
              '&:disabled': {
                backgroundColor: 'grey.300',
                color: 'text.disabled',
              },
            }}
          >
            {isSending ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </Tooltip>
      </motion.div>
    </Box>
  );
};

export default MessageInput;
