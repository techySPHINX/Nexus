# 🎛️ Sub-Issue: Customizable Dashboard Widgets

## Goal
Enable users to customize their dashboard layout with drag-and-drop widgets, show/hide options, widget settings, and preset layouts for different roles.

## Tasks
- [ ] Design and migrate Prisma schema for DashboardConfig and widget settings
- [ ] Integrate react-grid-layout for drag-and-drop customization
- [ ] Build widget library (connection stats, message activity, profile, community, referrals, events, leaderboard, quick actions)
- [ ] Add widget settings/configuration UI and preset layouts
- [ ] Implement persistence of layout and settings per user
- [ ] Write tests for widget rendering and layout persistence

## Acceptance Criteria
- Users can customize dashboard layout and widgets as described in [parent issue](./dashboard-analytics-core.md)
- Widget settings and layouts persist across sessions
- Preset layouts available for students, alumni, admins

---
Linked from: #dashboard-analytics-core
