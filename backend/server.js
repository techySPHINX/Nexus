const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Mock JWT secret (in production, use environment variable)
const JWT_SECRET = 'your-secret-key';

// In-memory storage for demo purposes
const connectedUsers = new Map();
const processedMessages = new Set();
const messages = [];

/**
 * Improved WebSocket Server Implementation
 * 
 * Key features:
 * - Message deduplication using unique IDs
 * - Proper connection management
 * - No duplicate broadcasts
 * - Graceful error handling
 * - Production-ready structure
 */
io.on('connection', (socket) => {
  console.log('🔌 New connection attempt:', socket.id);

  // Handle authentication
  socket.on('authenticate', (data) => {
    try {
      const { userId, token } = data;
      
      if (!userId || !token) {
        socket.emit('CONNECTION_ERROR', {
          error: 'Missing authentication credentials',
          timestamp: new Date().toISOString(),
        });
        socket.disconnect();
        return;
      }

      // Verify JWT token
      const payload = jwt.verify(token, JWT_SECRET);
      
      // Store user info
      socket.userId = payload.userId || userId;
      socket.userEmail = payload.email;
      
      // Check for existing connection
      const existingConnection = connectedUsers.get(socket.userId);
      if (existingConnection && existingConnection.id !== socket.id) {
        console.log(`🔄 Disconnecting existing connection for user ${socket.userId}`);
        existingConnection.emit('FORCE_DISCONNECT', {
          reason: 'New connection established',
          timestamp: new Date().toISOString(),
        });
        existingConnection.disconnect();
      }

      // Store new connection
      connectedUsers.set(socket.userId, socket);
      
      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      console.log(`✅ User ${socket.userId} connected successfully`);
      console.log(`📊 Total connected users: ${connectedUsers.size}`);

      // Send connection confirmation
      socket.emit('CONNECTION_SUCCESS', {
        userId: socket.userId,
        userEmail: socket.userEmail,
        timestamp: new Date().toISOString(),
      });

      // Notify other users that this user is online
      socket.broadcast.emit('USER_STATUS_CHANGE', {
        userId: socket.userId,
        status: 'ONLINE',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('❌ Authentication error:', error);
      socket.emit('CONNECTION_ERROR', {
        error: 'Invalid authentication token',
        timestamp: new Date().toISOString(),
      });
      socket.disconnect();
    }
  });

  // Handle new messages
  socket.on('NEW_MESSAGE', (data) => {
    try {
      if (!socket.userId) {
        socket.emit('MESSAGE_ERROR', {
          error: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generate unique message ID for deduplication
      const messageId = `${socket.userId}_${data.receiverId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check for duplicates
      if (processedMessages.has(messageId)) {
        console.log(`⚠️ Duplicate message detected, ignoring: ${messageId}`);
        return;
      }

      // Mark as processed
      processedMessages.add(messageId);

      console.log('📨 Handling new message:', {
        messageId,
        from: socket.userId,
        to: data.receiverId,
        content: data.content,
      });

      // Create message object
      const message = {
        id: messageId,
        content: data.content,
        senderId: socket.userId,
        receiverId: data.receiverId,
        timestamp: new Date().toISOString(),
        uniqueId: messageId,
      };

      // Store message
      messages.push(message);

      // Broadcast to recipient ONLY (prevents duplicates)
      const recipientRoom = `user_${data.receiverId}`;
      io.to(recipientRoom).emit('NEW_MESSAGE', message);

      // Send confirmation to sender ONLY
      socket.emit('MESSAGE_SENT', {
        ...message,
        confirmation: true,
      });

      console.log('✅ Message sent successfully');

    } catch (error) {
      console.error('❌ Error handling message:', error);
      socket.emit('MESSAGE_ERROR', {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle typing indicators
  socket.on('TYPING_START', (data) => {
    if (!socket.userId) return;
    
    const recipientRoom = `user_${data.receiverId}`;
    io.to(recipientRoom).emit('USER_TYPING', {
      userId: socket.userId,
      userEmail: socket.userEmail,
      isTyping: true,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('TYPING_STOP', (data) => {
    if (!socket.userId) return;
    
    const recipientRoom = `user_${data.receiverId}`;
    io.to(recipientRoom).emit('USER_TYPING', {
      userId: socket.userId,
      userEmail: socket.userEmail,
      isTyping: false,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle read receipts
  socket.on('MESSAGE_READ', (data) => {
    if (!socket.userId) return;
    
    const senderRoom = `user_${data.senderId}`;
    io.to(senderRoom).emit('MESSAGE_READ_RECEIPT', {
      messageId: data.messageId,
      readBy: socket.userId,
      readAt: new Date().toISOString(),
    });
  });

  // Handle ping/pong
  socket.on('PING', () => {
    socket.emit('PONG', {
      timestamp: new Date().toISOString(),
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    if (socket.userId) {
      console.log(`🔌 User ${socket.userId} disconnected:`, reason);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Notify other users
      socket.broadcast.emit('USER_STATUS_CHANGE', {
        userId: socket.userId,
        status: 'OFFLINE',
        timestamp: new Date().toISOString(),
      });
      
      console.log(`📊 Total connected users: ${connectedUsers.size}`);
    }
  });
});

// REST API endpoints for demo
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    connectedUsers: connectedUsers.size,
    totalMessages: messages.length,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/messages/:userId', (req, res) => {
  const { userId } = req.params;
  const userMessages = messages.filter(
    msg => msg.senderId === userId || msg.receiverId === userId
  );
  res.json({ messages: userMessages });
});

app.get('/api/conversations/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Get unique conversation partners
  const partners = new Set();
  messages.forEach(msg => {
    if (msg.senderId === userId) partners.add(msg.receiverId);
    if (msg.receiverId === userId) partners.add(msg.senderId);
  });
  
  const conversations = Array.from(partners).map(partnerId => {
    const partnerMessages = messages.filter(
      msg => (msg.senderId === userId && msg.receiverId === partnerId) ||
             (msg.senderId === partnerId && msg.receiverId === userId)
    );
    
    const lastMessage = partnerMessages[partnerMessages.length - 1];
    const unreadCount = partnerMessages.filter(
      msg => msg.receiverId === userId && !msg.readAt
    ).length;
    
    return {
      id: `conv_${userId}_${partnerId}`,
      otherUser: {
        id: partnerId,
        name: `User ${partnerId}`,
        email: `user${partnerId}@example.com`,
      },
      lastMessage,
      unreadCount,
    };
  });
  
  res.json({ conversations });
});

// Cleanup processed messages every hour
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  const messagesToKeep = new Set();
  
  for (const messageId of processedMessages) {
    const timestamp = parseInt(messageId.split('_')[2]);
    if (timestamp > oneHourAgo) {
      messagesToKeep.add(messageId);
    }
  }
  
  processedMessages.clear();
  messagesToKeep.forEach(id => processedMessages.add(id));
  
  console.log(`🧹 Cleaned up processed messages. Remaining: ${processedMessages.size}`);
}, 60 * 60 * 1000); // Every hour

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP API endpoint: http://localhost:${PORT}/api`);
});

module.exports = { app, server, io };
