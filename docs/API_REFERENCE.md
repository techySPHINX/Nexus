# API Reference

Base URL: `http://localhost:3000` (development) / `https://nexus.example.com` (production)

All protected endpoints require the `Authorization: Bearer <access_token>` header.

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Profiles](#profiles)
- [Posts](#posts)
- [Comments](#comments)
- [Connections](#connections)
- [Messaging](#messaging)
- [Mentorship](#mentorship)
- [Referrals](#referrals)
- [Notifications](#notifications)
- [Files](#files)
- [Admin](#admin)
- [Health & Metrics](#health--metrics)
- [WebSocket Events](#websocket-events)
- [Error Responses](#error-responses)

---

## Authentication

### POST `/auth/register`

Register a new user account.

**Request**

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "STUDENT"
}
```

**Response `201`**

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

---

### POST `/auth/register-with-documents`

Register as an Alumni with identity verification documents (multipart/form-data).

**Form fields**: `email`, `password`, `firstName`, `lastName`, `document` (file)

**Response `201`** — same as `/auth/register` but account starts in `PENDING_VERIFICATION` state.

---

### POST `/auth/login`

Authenticate and receive tokens.

**Request**

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

**Response `200`**

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "STUDENT"
  }
}
```

---

### POST `/auth/refresh`

Obtain a new access token using a refresh token.

**Request**

```json
{ "refreshToken": "eyJhbGci..." }
```

**Response `200`**

```json
{ "accessToken": "eyJhbGci..." }
```

---

### POST `/auth/logout`

Revoke the current refresh token. 🔒 _Protected_

**Response `200`** `{ "message": "Logged out successfully" }`

---

### POST `/auth/logout-all`

Revoke **all** refresh tokens for the user. 🔒 _Protected_

---

### POST `/auth/verify-email`

Verify email address with the token sent by email.

**Request** `{ "token": "verification-token" }`

---

### POST `/auth/resend-verification`

Resend the email verification link. 🔒 _Protected_

---

### GET `/auth/document-status`

Get current document verification status. 🔒 _Protected_

**Response `200`** `{ "status": "PENDING" | "APPROVED" | "REJECTED" }`

---

## Users

### GET `/users`

List all users. 🔒 _Protected_

**Query params**: `page` (default 1), `limit` (default 20), `role`

**Response `200`**

```json
{
  "data": [{ "id": "uuid", "email": "...", "role": "STUDENT", ... }],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### GET `/users/search`

Search users by name or email. 🔒 _Protected_

**Query**: `q` (search string), `role`, `page`, `limit`

---

### GET `/users/:id`

Get a user by ID. 🔒 _Protected_

---

### PATCH `/users/:id`

Update a user's details. 🔒 _Protected_ (own account or ADMIN)

**Request** (partial) `{ "firstName": "Jane", "lastName": "Smith" }`

---

### DELETE `/users/:id`

Delete a user account. 🔒 _Protected_ (own account or ADMIN)

---

### POST `/users/fcm/register`

Register a Firebase Cloud Messaging token for push notifications. 🔒 _Protected_

**Request** `{ "token": "fcm-device-token" }`

---

### POST `/users/fcm/unregister`

Remove a registered FCM token. 🔒 _Protected_

---

### GET `/user/gdpr/export`

Export all personal data (GDPR). 🔒 _Protected_

**Response** `200` — JSON blob of all user data.

---

### POST `/user/gdpr/anonymize`

Anonymize account data in place. 🔒 _Protected_

---

### DELETE `/user/gdpr/delete-account`

Permanently delete account and all data. 🔒 _Protected_

---

## Profiles

### GET `/profile/:userId`

Get the full profile of a user. 🔒 _Protected_

**Response `200`**

```json
{
  "id": "uuid",
  "bio": "Full-stack developer",
  "headline": "Software Engineer @ Acme",
  "skills": [{ "name": "TypeScript", "endorsements": [...] }],
  "education": [...],
  "experience": [...]
}
```

---

### PUT `/profile`

Create or update own profile. 🔒 _Protected_

---

### POST `/profile/skills`

Add a skill to your profile. 🔒 _Protected_

**Request** `{ "name": "React" }`

---

### POST `/profile/skills/:skillId/endorse`

Endorse a skill on another user's profile. 🔒 _Protected_

---

## Posts

### POST `/posts`

Create a new post. 🔒 _Protected_

**Request**

```json
{
  "title": "My Experience at Acme",
  "content": "...",
  "subCommunityId": "uuid"
}
```

---

### GET `/posts/feed`

Get personalized feed for the current user. 🔒 _Protected_

**Query**: `page`, `limit`

---

### GET `/posts/recent`

Get recently published posts (public). Optional auth for personalization.

---

### GET `/posts/user/:userId`

Get all posts by a specific user. 🔒 _Protected_

---

### GET `/posts/subcommunity/:subCommunityId/feed`

Get posts for a specific sub-community. 🔒 _Protected_

---

### GET `/posts/pending`

Get posts pending moderation. 🔒 _Protected_ (ADMIN or MODERATOR)

---

### GET `/posts/search`

Full-text search across posts. 🔒 _Protected_

**Query**: `q`, `page`, `limit`

---

### GET `/posts/:id`

Get a single post. 🔒 _Protected_

---

### PATCH `/posts/:id`

Update a post. 🔒 _Protected_ (own post)

---

### DELETE `/posts/:id`

Delete a post. 🔒 _Protected_ (own post or ADMIN)

---

### GET `/posts/:id/stats`

Get engagement statistics for a post. 🔒 _Protected_

**Response** `{ "views": 120, "likes": 45, "comments": 12, "shares": 8 }`

---

### PATCH `/posts/:id/approve`

Approve a pending post. 🔒 _Protected_ (ADMIN / MODERATOR)

---

### PATCH `/posts/:id/reject`

Reject a pending post. 🔒 _Protected_ (ADMIN / MODERATOR)

---

## Comments

### POST `/posts/:postId/comments`

Add a comment to a post. 🔒 _Protected_

**Request** `{ "content": "Great post!" }`

---

### GET `/posts/:postId/comments`

Get comments for a post. 🔒 _Protected_

**Query**: `page`, `limit`

---

### PATCH `/posts/:postId/comments/:commentId`

Edit a comment. 🔒 _Protected_ (own comment)

---

### DELETE `/posts/:postId/comments/:commentId`

Delete a comment. 🔒 _Protected_ (own comment or ADMIN)

---

## Connections

### POST `/connections/request/:targetUserId`

Send a connection request. 🔒 _Protected_

---

### PATCH `/connections/:connectionId/accept`

Accept a connection request. 🔒 _Protected_

---

### PATCH `/connections/:connectionId/reject`

Reject a connection request. 🔒 _Protected_

---

### DELETE `/connections/:connectionId`

Remove a connection. 🔒 _Protected_

---

### GET `/connections`

List your connections. 🔒 _Protected_

---

### GET `/connections/pending`

List incoming pending requests. 🔒 _Protected_

---

## Messaging

### GET `/messaging/conversations`

List all conversations. 🔒 _Protected_

---

### POST `/messaging/conversations`

Start a new conversation. 🔒 _Protected_

**Request** `{ "participantId": "uuid" }`

---

### GET `/messaging/conversations/:conversationId/messages`

Get paginated message history. 🔒 _Protected_

**Query**: `page`, `limit` (default 50)

---

### POST `/messaging/conversations/:conversationId/messages`

Send a message (REST fallback; prefer WebSocket). 🔒 _Protected_

**Request** `{ "content": "Hello!", "type": "TEXT" | "FILE" }`

---

## Mentorship

### GET `/mentorship/listings`

Browse active mentorship listings. 🔒 _Protected_

---

### POST `/mentorship/listings`

Create a mentorship listing (Alumni only). 🔒 _Protected_

**Request** `{ "title": "Career in ML", "description": "...", "skills": ["Python"] }`

---

### POST `/mentorship/listings/:listingId/apply`

Apply to a mentorship listing (Student only). 🔒 _Protected_

---

### GET `/mentorship/applications`

Get your sent or received mentorship applications. 🔒 _Protected_

---

### PATCH `/mentorship/applications/:id/accept`

Accept a mentorship application. 🔒 _Protected_ (Mentor)

---

### PATCH `/mentorship/applications/:id/reject`

Reject a mentorship application. 🔒 _Protected_ (Mentor)

---

## Referrals

### POST `/referrals`

Create a job referral. 🔒 _Protected_ (Alumni)

**Request**

```json
{
  "jobTitle": "Software Engineer",
  "company": "Acme Inc.",
  "description": "Backend role, 3 yrs exp required",
  "applyUrl": "https://jobs.acme.com/..."
}
```

---

### GET `/referrals`

List available referrals. 🔒 _Protected_

---

## Notifications

### GET `/notifications`

Fetch notifications for the current user. 🔒 _Protected_

**Query**: `page`, `limit`, `unreadOnly` (boolean)

---

### PATCH `/notifications/:id/read`

Mark a notification as read. 🔒 _Protected_

---

### POST `/notifications/read-all`

Mark all notifications as read. 🔒 _Protected_

---

## Files

### POST `/files/upload`

Upload a file (multipart/form-data). 🔒 _Protected_

**Form field**: `file`

**Response `201`** `{ "url": "https://cdn.example.com/...", "key": "uploads/uuid.pdf" }`

---

### DELETE `/files/:key`

Delete an uploaded file. 🔒 _Protected_

---

## Admin

### GET `/admin/users`

List all users with filters. 🔒 _Protected_ (ADMIN)

---

### PATCH `/admin/users/:id/role`

Change a user's role. 🔒 _Protected_ (ADMIN)

**Request** `{ "role": "ALUMNI" | "STUDENT" | "ADMIN" }`

---

### PATCH `/admin/users/:id/status`

Activate, deactivate, or ban a user. 🔒 _Protected_ (ADMIN)

---

### GET `/auth/admin/pending-documents`

List pending alumni verification documents. 🔒 _Protected_ (ADMIN)

---

### POST `/auth/admin/approve-documents`

Approve a verification document. 🔒 _Protected_ (ADMIN)

**Request** `{ "userId": "uuid" }`

---

### POST `/auth/admin/reject-documents`

Reject a verification document. 🔒 _Protected_ (ADMIN)

**Request** `{ "userId": "uuid", "reason": "Document unclear" }`

---

## Health & Metrics

### GET `/health`

Service liveness check (public).

**Response `200`** `{ "status": "ok", "info": { "database": { "status": "up" }, "redis": { "status": "up" } } }`

---

### GET `/metrics`

Prometheus metrics in text format. 🔒 _Protected_ (ADMIN)

---

## WebSocket Events

Connect to `wss://nexus.example.com` with:

```js
const socket = io('https://nexus.example.com', {
  auth: { token: '<access_token>' },
});
```

### Client → Server

| Event          | Payload                             | Description               |
| -------------- | ----------------------------------- | ------------------------- |
| `join-room`    | `{ roomId: string }`                | Join a conversation room  |
| `leave-room`   | `{ roomId: string }`                | Leave a conversation room |
| `send-message` | `{ conversationId, content, type }` | Send a message            |
| `typing-start` | `{ conversationId: string }`        | Signal typing started     |
| `typing-stop`  | `{ conversationId: string }`        | Signal typing stopped     |
| `mark-read`    | `{ messageId: string }`             | Mark a message as read    |

### Server → Client

| Event               | Payload                                | Description                  |
| ------------------- | -------------------------------------- | ---------------------------- |
| `new-message`       | `Message` object                       | New message in a joined room |
| `message-delivered` | `{ messageId, conversationId }`        | Delivery confirmation        |
| `message-read`      | `{ messageId, readBy }`                | Read receipt                 |
| `typing`            | `{ userId, conversationId, isTyping }` | Typing indicator             |
| `user-online`       | `{ userId: string }`                   | Contact came online          |
| `user-offline`      | `{ userId: string }`                   | Contact went offline         |
| `notification`      | `Notification` object                  | Real-time notification       |
| `error`             | `{ message: string }`                  | Server-side error            |

---

## Error Responses

All errors follow RFC 7807:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "must be a valid email" }],
  "timestamp": "2026-03-02T12:00:00.000Z",
  "path": "/auth/register"
}
```

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| `400`  | Bad Request — validation error             |
| `401`  | Unauthorized — missing or expired token    |
| `403`  | Forbidden — insufficient role              |
| `404`  | Not Found                                  |
| `409`  | Conflict — e.g. duplicate email            |
| `422`  | Unprocessable Entity                       |
| `429`  | Too Many Requests — rate limited           |
| `500`  | Internal Server Error (reported to Sentry) |
