# ⚡ Sub-Issue: Real-Time Activity Feed

## Goal
Implement a real-time activity feed with WebSocket updates, infinite scroll, filtering, icons, and read/unread states for all dashboard users.

## Tasks
- [ ] Extend Prisma schema for UserActivity and activity types
- [ ] Build backend event tracking and WebSocket gateway
- [ ] Create frontend activity feed component with tabs and infinite scroll
- [ ] Add activity icons, timestamps, and notification system
- [ ] Integrate read/unread state and activity filtering
- [ ] Write tests for event delivery and feed rendering

## Acceptance Criteria
- Activity feed updates in real-time and supports infinite scroll
- Filtering and notification features work as described in [parent issue](./dashboard-analytics-core.md)
- All activity types are tracked and displayed

---
Linked from: #dashboard-analytics-core
