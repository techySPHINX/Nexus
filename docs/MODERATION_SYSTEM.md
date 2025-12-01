# Production-Grade Report & Moderation System

## Overview
This is a comprehensive production-grade content moderation system with full audit trails, user action tracking, batch operations, and analytics.

## Key Features Fixed & Implemented

### 1. **FIXED: Report PostId Issue**
- ✅ All comment reports now automatically extract and store `postId` from the comment
- ✅ Ensures ContentReport always has `postId` for proper context tracking
- ✅ Validates content exists and is not already deleted before allowing reports

### 2. **Soft Delete System**
- Posts and comments support soft deletion
- Tracks: `isDeleted`, `deletedAt`, `deletedBy`, `deletionReason`
- Content remains in database for audit/recovery
- Prevents reporting already-deleted content

### 3. **User Action System**
Complete user punishment tracking with:
- **WARNING** - Issue warning to user
- **TEMPORARY_BAN** - Ban with expiration (1-365 days)
- **PERMANENT_BAN** - Permanent account suspension
- **RESTRICT_POSTING** - Prevent posting/commenting
- **REMOVE_PRIVILEGES** - Remove special permissions
- **CONTENT_REMOVAL** - Track content deletion

Features:
- Action expiration tracking
- Revocation support with audit trail
- Multiple active actions per user
- Automatic account status updates
- Metadata storage for context

### 4. **Moderation Audit Log**
Complete audit trail for all moderation actions:
- Report creation/resolution/dismissal
- Content deletions
- User actions taken/revoked
- Batch operations
- Full metadata preservation

### 5. **Comprehensive API Endpoints**

#### Report Management
- `POST /reports` - Create report (with auto postId extraction)
- `GET /reports` - List all reports with advanced filtering
- `GET /reports/:id` - Get detailed report with violation history
- `PATCH /reports/:id/resolve` - Resolve/dismiss report
- `DELETE /reports/:id/content` - Soft delete reported content

#### User Actions
- `POST /reports/:id/user-action` - Take action against user
- `PATCH /reports/user-action/:actionId/revoke` - Revoke user action
- `GET /reports/user/:userId/violations` - Get user violation history

#### Batch Operations
- `POST /reports/batch/resolve` - Batch resolve multiple reports
- `POST /reports/batch/dismiss` - Batch dismiss multiple reports

#### Analytics
- `GET /reports/analytics/dashboard` - Moderation analytics & metrics

### 6. **Advanced Filtering**
Filter reports by:
- Content type (POST/COMMENT)
- Status (PENDING/ADDRESSED/DISMISSED)
- Date range
- Reporter
- Sub-community
- Handler
- Search term in reason

### 7. **Production-Grade Features**

#### Security
- Admin-only endpoints with role guards
- Input validation on all DTOs
- Prevents duplicate reports
- Validates content exists before reporting

#### Error Handling
- Comprehensive error messages
- Transaction safety
- Graceful audit log failures
- Prevents cascading failures

#### Data Integrity
- Foreign key constraints
- Indexed queries for performance
- Soft deletes preserve data
- Audit trail preservation

#### Scalability
- Cursor-based pagination (up to 100 per page)
- Indexed columns for fast queries
- Efficient batch operations
- Analytics query optimization

## Database Schema

### New Tables
```sql
UserAction - Tracks all punitive actions
  - id, userId, actionType, reason, reportId
  - adminId, expiresAt, isActive
  - revokedAt, revokedBy, revokeReason
  - metadata (JSON)

ModerationLog - Complete audit trail
  - id, actionType, performedById
  - targetUserId, reportId, postId, commentId
  - details, metadata (JSON)
```

### Enhanced Tables
```sql
Post + Comment:
  - isDeleted, deletedAt
  - deletedBy, deletionReason

ContentReport:
  - Relations to UserAction[]
  - Relations to ModerationLog[]
```

### New Enums
```typescript
UserActionType = WARNING | TEMPORARY_BAN | PERMANENT_BAN | 
                 RESTRICT_POSTING | REMOVE_PRIVILEGES | CONTENT_REMOVAL

ModerationActionType = REPORT_CREATED | REPORT_RESOLVED | REPORT_DISMISSED |
                       CONTENT_DELETED | USER_ACTION_TAKEN | 
                       USER_ACTION_REVERTED | BATCH_OPERATION
```

## API Usage Examples

### 1. Create Report (Auto-extracts postId from comment)
```bash
POST /reports
{
  "type": "COMMENT",
  "reason": "Spam content violating community guidelines",
  "commentId": "comment-uuid"
  # postId automatically extracted from comment!
}
```

### 2. Resolve Report
```bash
PATCH /reports/:id/resolve
{
  "action": "ADDRESSED",
  "reason": "Verified violation, took appropriate action",
  "notes": "User warned, content removed"
}
```

### 3. Take User Action
```bash
POST /reports/:id/user-action
{
  "actionType": "TEMPORARY_BAN",
  "reason": "Repeated violations of community standards",
  "durationDays": 7,
  "notes": "Third violation this month"
}
```

### 4. Delete Content
```bash
DELETE /reports/:id/content
{
  "reason": "Violates ToS - harassment"
}
```

### 5. Batch Resolve
```bash
POST /reports/batch/resolve
{
  "reportIds": ["id1", "id2", "id3"],
  "reason": "Resolved during spam cleanup operation"
}
```

### 6. Get Analytics
```bash
GET /reports/analytics/dashboard?days=30
Response:
{
  "period": { "days": 30, "startDate": "...", "endDate": "..." },
  "summary": {
    "totalReports": 150,
    "pendingReports": 12,
    "resolvedReports": 120,
    "dismissedReports": 18,
    "resolutionRate": 92.0
  },
  "reportsByType": [...],
  "topReporters": [...],
  "topOffenders": [...],
  "recentActions": [...]
}
```

### 7. Get User Violations
```bash
GET /reports/user/:userId/violations
Response:
{
  "userId": "...",
  "totalViolations": 3,
  "activeActions": 1,
  "activeBans": 1,
  "totalReports": 5,
  "actions": [...],
  "reports": [...]
}
```

### 8. Revoke User Action
```bash
PATCH /reports/user-action/:actionId/revoke
{
  "reason": "Appeal approved - action taken in error"
}
```

## Migration Steps

1. **Run Prisma Migration**
```bash
cd backend
npx prisma migrate dev --name add_moderation_system
```

2. **Generate Prisma Client**
```bash
npx prisma generate
```

3. **Verify Schema**
```bash
npx prisma studio
# Check UserAction and ModerationLog tables exist
```

## Testing Checklist

- [ ] Create report for post
- [ ] Create report for comment (verify postId auto-extracted)
- [ ] Try duplicate report (should fail)
- [ ] Filter reports by type/status/date
- [ ] Resolve report
- [ ] Dismiss report
- [ ] Take warning action against user
- [ ] Take temporary ban (7 days)
- [ ] Take permanent ban
- [ ] Soft delete post via report
- [ ] Soft delete comment via report
- [ ] Revoke user action
- [ ] Batch resolve multiple reports
- [ ] Batch dismiss multiple reports
- [ ] Get analytics dashboard
- [ ] Get user violation history
- [ ] Verify moderation logs created

## Performance Considerations

### Indexes Created
- `user_actions(userId, isActive)` - Fast active action lookup
- `user_actions(reportId)` - Link actions to reports
- `user_actions(expiresAt)` - Find expired bans
- `moderation_logs(performedById)` - Admin action history
- `moderation_logs(targetUserId)` - User history
- `moderation_logs(createdAt, actionType)` - Analytics queries
- `Post(isDeleted)`, `Comment(isDeleted)` - Filter deleted content

### Query Optimization
- Pagination limited to 100 items max
- Selective includes to avoid N+1 queries
- Indexed foreign keys
- Efficient batch operations

## Security Features

1. **Admin-Only Operations**: All moderation endpoints require ADMIN role
2. **Duplicate Prevention**: Can't report same content twice while pending
3. **Validation**: All DTOs validated (10-1000 char reasons, valid dates, etc.)
4. **Deleted Content**: Can't report already-deleted content
5. **Account Status**: Automatic updates on bans/revocations
6. **Audit Trail**: Every action logged (even if main operation fails)

## Best Practices

### For Admins
1. Always provide detailed reasons for actions
2. Use warnings before bans when appropriate
3. Review user violation history before major actions
4. Use batch operations for efficiency
5. Check analytics regularly for trends

### For Developers
1. Audit logs never fail main operations
2. Use transactions for critical multi-step operations
3. Validate admin status before operations
4. Include metadata for context
5. Soft delete > hard delete

## Future Enhancements

- [ ] Email notifications to users on actions
- [ ] Appeal system for user actions
- [ ] Auto-escalation for repeat offenders
- [ ] ML-based content flagging
- [ ] Report priority queue
- [ ] Moderation team assignments
- [ ] Export reports to CSV
- [ ] Real-time dashboard with WebSocket
- [ ] Content restoration workflow
- [ ] IP-based tracking

## Troubleshooting

### Issue: "Cannot determine target user"
- Report missing post/comment reference
- Check report type matches content type

### Issue: "Already reported"
- User has pending report for this content
- Admin must resolve existing report first

### Issue: "Cannot report deleted content"
- Content was soft-deleted
- Check `isDeleted` flag on Post/Comment

### Issue: "No pending reports found"
- Batch operation: All reports already resolved
- Filter and verify report IDs

## Compliance & Legal

This system maintains:
- Complete audit trail for legal compliance
- Soft deletes for data preservation
- User action justifications
- Admin accountability
- Data retention capabilities

---

**Status**: ✅ Production Ready  
**Last Updated**: December 2024  
**Version**: 1.0.0
