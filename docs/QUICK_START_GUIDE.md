# Quick Start Guide - Test Your Messaging Platform

## Backend Setup

### 1. Install Dependencies (if not already done)
```bash
cd backend
pnpm install
```

### 2. Configure Environment Variables

Create/update `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/nexus"

# JWT
JWT_SECRET="your-secret-key"
JWT_ACCESS_TOKEN_EXPIRATION="15m"
JWT_REFRESH_TOKEN_EXPIRATION="7d"

# Redis (for WebSocket scaling)
REDIS_URL="redis://localhost:6379"

# Firebase Cloud Messaging (optional, for push notifications)
FCM_PROJECT_ID="your-project-id"
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"

# Or use service account JSON
FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

### 3. Run Database Migration
```bash
cd backend
npx prisma db push
npx prisma generate
```

### 4. Start Backend Server
```bash
cd backend
npm run start:dev
```

Backend should start on `http://localhost:3000`

---

## Frontend Setup

### 1. Install Dependencies (already done ✅)
```bash
cd frontend
pnpm install
```

### 2. Configure Environment Variables

Create `frontend/.env`:

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:3000

# Firebase Configuration (optional, for push notifications)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

### 3. Update firebase-messaging-sw.js

Edit `frontend/public/firebase-messaging-sw.js` and replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: 'YOUR_ACTUAL_API_KEY',
  authDomain: 'YOUR_ACTUAL_AUTH_DOMAIN',
  projectId: 'YOUR_ACTUAL_PROJECT_ID',
  storageBucket: 'YOUR_ACTUAL_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_ACTUAL_SENDER_ID',
  appId: 'YOUR_ACTUAL_APP_ID',
};
```

### 4. Start Frontend Dev Server
```bash
cd frontend
npm start
```

Frontend should start on `http://localhost:5173`

---

## Testing WebSocket Features

### Test 1: Basic Messaging (Without ChatPage Changes)

1. Open browser console (F12)
2. Login to your app
3. Navigate to `/chat`
4. Open DevTools Console
5. Look for these logs:
   - ✅ `🔌 Attempting to connect to WebSocket...`
   - ✅ `✅ Socket.IO connected`
   - ✅ `✅ WebSocket connected successfully`

### Test 2: Send a Message

1. Select a conversation or start a new one
2. Type a message and send
3. Check console for:
   - `📤 Sending message via WebSocket`
   - `📨 New message received` (on recipient's side)

### Test 3: Read Receipts (After Integration)

1. User A sends message to User B
2. User B opens conversation
3. User A should see double blue checkmark ✓✓
4. Console should show: `👁️ Message read update`

### Test 4: Message Editing (After Integration)

1. Send a message
2. Click edit button
3. Change content and save
4. Should see "(edited)" label
5. Console should show: `✏️ Message edited`

### Test 5: Offline Sync

1. Disconnect internet
2. Have another user send you messages
3. Reconnect internet
4. Console should show: `✅ Synced X messages from server`
5. All missed messages should appear

---

## Debugging Tips

### WebSocket Not Connecting?

Check:
1. Backend is running on port 3000
2. CORS is configured in `main.ts`
3. JWT token is valid
4. Console shows connection attempt

### Messages Not Saving to IndexedDB?

Open browser DevTools:
1. Application tab
2. IndexedDB → NexusMessagingDB
3. Check `messages` and `conversations` tables
4. Should see entries there

### Push Notifications Not Working?

Check:
1. Firebase credentials are correct
2. Notification permission is granted (browser popup)
3. Device token is registered with backend
4. Console shows: `✅ FCM token obtained`

### Read Receipts Not Showing?

Check:
1. MESSAGE_READ event is sent when opening conversation
2. MESSAGE_READ_UPDATE is received by sender
3. MessageStatus component is integrated
4. Console shows: `👁️ Message read update`

---

## Quick Verification Commands

### Backend Health Check
```bash
curl http://localhost:3000/health
```

### Check WebSocket Connection
Open browser console and run:
```javascript
const socket = io('http://localhost:3000/ws', {
  query: { userId: 'your-user-id', token: 'your-jwt-token' }
});
socket.on('connect', () => console.log('✅ Connected'));
socket.on('error', (err) => console.error('❌ Error:', err));
```

### Check Database
```bash
cd backend
npx prisma studio
```
This opens a GUI to browse your database.

### Check Redis (if using)
```bash
redis-cli
> KEYS *
> GET key_name
```

---

## Common Issues & Solutions

### Issue: "Cannot find module 'dexie'"
**Solution:** Run `pnpm install` in frontend directory

### Issue: "Firebase not initialized"
**Solution:** Check .env file has Firebase credentials, or disable FCM temporarily

### Issue: "Prisma Client not generated"
**Solution:** Run `npx prisma generate` in backend directory

### Issue: "CORS error"
**Solution:** Check `main.ts` has `app.enableCors()` or proper CORS config

### Issue: "Redis connection failed"
**Solution:** Either install Redis or remove Redis adapter temporarily (app will use in-memory)

### Issue: "Messages not persisting on refresh"
**Solution:** Ensure IndexedDB integration is complete in ChatPage

---

## Next Steps After Setup

1. **Test Current Features** (without ChatPage changes)
   - Login
   - Load conversations
   - Send/receive messages (basic)

2. **Integrate ChatPage** (follow CHATPAGE_INTEGRATION_GUIDE.md)
   - Step 1-2: Zustand store integration
   - Step 5: Event handlers
   - Step 6: Optimistic UI
   - Step 10: MessageStatus component

3. **Test New Features**
   - Optimistic UI
   - Read receipts
   - Message editing
   - Message deletion
   - Offline sync

4. **Optional Enhancements**
   - Infinite scroll
   - End-to-end encryption
   - Voice messages
   - File attachments

---

## Performance Monitoring

### Backend
- Check server logs for errors
- Monitor Redis memory usage
- Check database query performance

### Frontend
- Check Network tab for WebSocket frames
- Monitor IndexedDB storage (DevTools → Application)
- Check memory usage (DevTools → Performance)

---

## Need Help?

### Documentation References
- **Backend:** `MESSAGING_IMPLEMENTATION_GUIDE.md`
- **Frontend:** `CHATPAGE_INTEGRATION_GUIDE.md`
- **Progress:** `PROGRESS_SUMMARY.md`
- **Tasks:** `IMPLEMENTATION_CHECKLIST.md`

### Logs to Check
- Backend: Terminal where `npm run start:dev` is running
- Frontend: Browser DevTools Console
- Database: `npx prisma studio`
- Redis: `redis-cli monitor`

---

**You're all set! Start with the backend, then integrate the frontend step by step.** 🚀
