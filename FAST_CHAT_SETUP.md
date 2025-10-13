# 🚀 Fast Chat Setup Guide

## Quick Setup for Fast & Robust Chat

This guide will help you set up a fast, robust chat system that can handle thousands of concurrent users.

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server (for horizontal scaling)

## 🔧 Environment Setup

### 1. Copy Environment File
```bash
cp env.example .env.local
```

### 2. Configure Environment Variables
Edit `.env.local` with your actual values:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/nexus_chat"

# JWT Configuration (REQUIRED - generate a secure random string)
JWT_SECRET="your-super-secure-jwt-secret-key-minimum-32-characters-long"

# Redis Configuration (for horizontal scaling)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Application Configuration
NODE_ENV=development
PORT=3000

# Frontend URLs (for CORS)
FRONTEND_URLS=http://localhost:3001,http://localhost:3000
```

### 3. Generate JWT Secret
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start Redis (Required for horizontal scaling)
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:alpine

# Or install locally
# macOS: brew install redis && brew services start redis
# Ubuntu: sudo apt install redis-server && sudo systemctl start redis
```

### 3. Setup Database
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 4. Start Backend
```bash
npm run start:dev
```

## 🎯 Key Features Implemented

### ✅ **Fast & Robust Chat**
- **WebSocket connections** with automatic reconnection
- **Message deduplication** to prevent duplicates
- **Rate limiting** (100 messages/minute per user)
- **User presence tracking** (online/offline status)
- **Typing indicators** with auto-timeout
- **Connection management** and cleanup

### ✅ **Horizontal Scaling**
- **Redis adapter** for Socket.IO multi-instance support
- **Load balancing ready** for multiple backend instances
- **Stateless design** for easy scaling

### ✅ **Performance Optimizations**
- **Redis caching** for user presence and rate limiting
- **Connection pooling** and resource management
- **Automatic cleanup** of inactive connections
- **Memory management** for processed messages

## 🔌 WebSocket Events

### Client → Server Events
```javascript
// Authenticate connection
socket.emit('authenticate', { userId: 'user123', token: 'jwt-token' });

// Send message
socket.emit('NEW_MESSAGE', { 
  receiverId: 'user456', 
  content: 'Hello!' 
});

// Typing indicators
socket.emit('TYPING_START', { receiverId: 'user456', isTyping: true });
socket.emit('TYPING_STOP', { receiverId: 'user456', isTyping: false });

// Get online users
socket.emit('GET_ONLINE_USERS');

// Health check
socket.emit('HEALTH_CHECK');
```

### Server → Client Events
```javascript
// Connection success
socket.on('CONNECTION_SUCCESS', (data) => {
  console.log('Connected:', data.userId);
});

// New message received
socket.on('NEW_MESSAGE', (message) => {
  console.log('New message:', message);
});

// Message sent confirmation
socket.on('MESSAGE_SENT', (data) => {
  console.log('Message sent:', data.messageId);
});

// User typing
socket.on('USER_TYPING', (data) => {
  console.log('User typing:', data.userId, data.isTyping);
});

// User presence update
socket.on('USER_PRESENCE_UPDATE', (data) => {
  console.log('User presence:', data.userId, data.status);
});

// Online users list
socket.on('ONLINE_USERS', (users) => {
  console.log('Online users:', users);
});

// Rate limit exceeded
socket.on('RATE_LIMIT_EXCEEDED', (data) => {
  console.log('Rate limit exceeded:', data.error);
});
```

## 📊 Performance Features

### **Rate Limiting**
- 100 messages per minute per user
- Automatic blocking for 60 seconds if exceeded
- Redis-based rate limiting for scalability

### **Message Deduplication**
- Unique message IDs prevent duplicates
- Automatic cleanup of old message IDs
- Memory-efficient processing

### **Connection Management**
- Automatic cleanup of inactive connections (5 minutes)
- Single connection per user (new connection disconnects old)
- Health checks and monitoring

### **Presence Tracking**
- Real-time online/offline status
- Redis-based presence with TTL
- Broadcast to all connected users

## 🚀 Scaling for Production

### **Horizontal Scaling**
```bash
# Start multiple backend instances
npm run start:dev -- --port 3000
npm run start:dev -- --port 3001
npm run start:dev -- --port 3002

# Use load balancer (nginx) to distribute traffic
# Redis adapter handles message distribution across instances
```

### **Redis Configuration**
```bash
# For production, use Redis with persistence
docker run -d --name redis \
  -p 6379:6379 \
  redis:alpine \
  redis-server --appendonly yes --maxmemory 512mb
```

### **Environment Variables for Production**
```bash
NODE_ENV=production
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password
JWT_SECRET=your-production-jwt-secret
FRONTEND_URLS=https://your-domain.com
```

## 🔧 Troubleshooting

### **Common Issues**

1. **WebSocket Connection Failed**
   - Check CORS configuration in `FRONTEND_URLS`
   - Verify JWT token is valid
   - Check Redis is running

2. **Rate Limit Exceeded**
   - Reduce message frequency
   - Increase rate limit in code if needed

3. **Messages Not Delivered**
   - Check Redis connection
   - Verify user is online
   - Check WebSocket connection status

### **Health Checks**
```bash
# Check Redis connection
redis-cli ping

# Check WebSocket health
curl http://localhost:3000/health

# Check connected users
redis-cli keys "presence:*"
```

## 📈 Performance Monitoring

### **Key Metrics to Monitor**
- Connected users count
- Messages per second
- Redis memory usage
- WebSocket connection errors
- Rate limit violations

### **Logs to Watch**
```bash
# Backend logs
npm run start:dev | grep "Fast Chat Gateway"

# Redis logs
redis-cli monitor
```

## 🎉 Ready to Use!

Your fast chat system is now ready with:
- ✅ **Real-time messaging** with WebSocket
- ✅ **Horizontal scaling** with Redis
- ✅ **Rate limiting** and security
- ✅ **User presence** and typing indicators
- ✅ **Production-ready** configuration

The system can handle **thousands of concurrent users** and is ready for production deployment!
