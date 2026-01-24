# 🎯 Frontend: AI Matching & Recommendations UI

## Overview
Build intuitive UI for displaying AI-powered referral match scores, skill gap analysis, and personalized recommendations to students and alumni.

## Priority
**Medium** - Enhancement feature

## Tech Stack
- React + TypeScript
- Material-UI components
- Recharts for visualizations
- Framer Motion for animations
- React Query for data management

---

## Task 1: Match Score Display Components

### Components to Build
- [ ] Match score badge (0-100 with color coding)
- [ ] Match score breakdown card
- [ ] Match confidence indicator
- [ ] Match explanation tooltip

### Match Score Badge
```tsx
<MatchScoreBadge 
  score={85} 
  size="medium"
  showConfidence={true}
/>
```

**Features:**
- Color-coded (red <50, yellow 50-75, green >75)
- Circular progress indicator
- Hover shows quick summary
- Accessible with aria-labels

### Match Breakdown Card
```tsx
<MatchBreakdownCard
  score={85}
  breakdown={{
    skillMatch: 35,
    experienceMatch: 18,
    educationMatch: 13,
    locationMatch: 10,
    profileStrength: 7,
    historicalFit: 2
  }}
  explanation="Strong technical skills match..."
/>
```

**Features:**
- Horizontal bar chart for each component
- Tooltips explaining each factor
- Expandable details section
- Print-friendly format

### Components Structure
```
/components/Matching/
  ├── MatchScoreBadge.tsx
  ├── MatchBreakdownCard.tsx
  ├── MatchConfidenceIndicator.tsx
  └── MatchExplanation.tsx
```

### Acceptance Criteria
- [ ] Score displays correctly for all ranges (0-100)
- [ ] Breakdown sums to total score
- [ ] Colors meet WCAG AA contrast requirements
- [ ] Responsive on all screen sizes

---

## Task 2: Skill Gap Analysis Visualization

### Components to Build
- [ ] Missing skills list with importance badges
- [ ] Strength areas showcase
- [ ] Improvement suggestions panel
- [ ] Overall readiness gauge

### Missing Skills Display
```tsx
<SkillGapAnalysis
  gaps={[
    { 
      skill: 'React', 
      importance: 'critical',
      timeToLearn: '2-4 weeks',
      resources: [...]
    },
    ...
  ]}
  strengths={['JavaScript', 'Node.js']}
  readiness={72}
/>
```

**Features:**
- Categorized skill lists (Critical, Important, Nice-to-have)
- Learning time estimates
- Resource recommendations with links
- "Apply anyway" vs "Learn first" CTA

### Learning Path Suggestions
- [ ] Recommended courses/tutorials
- [ ] Estimated timeline visualization
- [ ] Progress tracking (if user opts in)
- [ ] Alternative career path suggestions

### Components Structure
```
/components/Matching/SkillGap/
  ├── SkillGapAnalysis.tsx
  ├── MissingSkillsList.tsx
  ├── StrengthsShowcase.tsx
  ├── LearningPathCard.tsx
  └── ReadinessGauge.tsx
```

### Acceptance Criteria
- [ ] Gap analysis is easy to understand
- [ ] Resource links are valid and helpful
- [ ] Readiness gauge accurately reflects status
- [ ] CTA buttons are contextually appropriate

---

## Task 3: Referral Card Enhancements

### Enhanced Referral Card
Update existing referral card component to include:
- [ ] Match score badge (top-right corner)
- [ ] Quick skill match indicator
- [ ] "Why this match?" expandable section
- [ ] Quick apply button for high matches

### Card Features
```tsx
<ReferralCard
  referral={referral}
  matchScore={85}
  matchReasons={['8/10 required skills', 'Location match', 'Experience level fits']}
  quickApplyEnabled={matchScore > 75}
  onViewGapAnalysis={() => {}}
/>
```

### Visual Indicators
- Match score badge: Top-right corner
- Skill match pills: Below title
- Experience fit icon: Next to company name
- Location match: Map pin icon with checkmark

### Components Structure
```
/components/Referrals/
  ├── EnhancedReferralCard.tsx
  ├── SkillMatchPills.tsx
  ├── QuickApplyButton.tsx
  └── MatchReasonsList.tsx
```

### Acceptance Criteria
- [ ] Match data doesn't clutter card design
- [ ] High matches are visually prominent
- [ ] Quick apply flow is seamless
- [ ] Cards load without layout shift

---

## Task 4: Personalized Recommendations Feed

### Recommendations Page
- [ ] "For You" section with top matches
- [ ] Filter by match score threshold
- [ ] Sort by score/recency/deadline
- [ ] Save referral for later
- [ ] Dismiss non-relevant suggestions

### Feed Features
```tsx
<RecommendationsFeed
  matches={topMatches}
  filters={{
    minScore: 70,
    location: 'Remote',
    industry: 'Tech'
  }}
  onApply={handleApply}
  onViewDetails={handleViewDetails}
/>
```

**Layout:**
- Hero section: "Top Match for You" (best match)
- Grid of recommended referrals (sorted by score)
- Infinite scroll pagination
- Empty state with improvement suggestions

### Smart Suggestions
- [ ] "90% match - Apply today!" alert for high matches
- [ ] "Close gap with 1 skill" prompt for near-matches
- [ ] "New matches this week" section
- [ ] "Trending in your field" recommendations

### Components Structure
```
/pages/Recommendations.tsx
/components/Recommendations/
  ├── RecommendationsFeed.tsx
  ├── TopMatchHero.tsx
  ├── RecommendationsGrid.tsx
  ├── RecommendationsFilters.tsx
  └── EmptyRecommendations.tsx
```

### Acceptance Criteria
- [ ] Recommendations load quickly (<1s)
- [ ] Filters apply without full page reload
- [ ] Saved referrals persist across sessions
- [ ] Feed updates with new matches automatically

---

## Task 5: Student Dashboard Integration

### Dashboard Widget
- [ ] "Top Matches for You" widget on dashboard
- [ ] Show 3-5 highest scoring matches
- [ ] Quick glance at match scores
- [ ] "View All Recommendations" CTA

### Widget Features
```tsx
<TopMatchesWidget
  userId={userId}
  limit={3}
  showScores={true}
/>
```

### Notifications Integration
- [ ] Badge notification for new high matches
- [ ] In-app alert when 90%+ match appears
- [ ] Weekly digest email with top matches
- [ ] Push notification for urgent deadlines

### Components Structure
```
/components/Dashboard/
  ├── TopMatchesWidget.tsx
  ├── NewMatchBadge.tsx
  └── MatchNotificationCard.tsx
```

### Acceptance Criteria
- [ ] Widget integrates seamlessly with existing dashboard
- [ ] Notifications are timely and not spammy
- [ ] Dashboard doesn't slow down with widget
- [ ] Widget is responsive on mobile

---

## Task 6: Alumni Match Insights

### Alumni View Features
- [ ] List of students who match your referral
- [ ] Sort by match score descending
- [ ] View student match breakdown
- [ ] Invite top matches to apply
- [ ] Analytics on match quality vs applications

### Alumni Dashboard Section
```tsx
<ReferralMatchesPanel
  referralId={referralId}
  matches={studentMatches}
  onInvite={handleInvite}
  onViewProfile={handleViewProfile}
/>
```

**Features:**
- Leaderboard-style list of matched students
- Match score and key qualifications visible
- One-click invite to apply
- Track who you've invited

### Components Structure
```
/components/Referrals/Alumni/
  ├── ReferralMatchesPanel.tsx
  ├── StudentMatchCard.tsx
  ├── InviteButton.tsx
  └── MatchAnalytics.tsx
```

### Acceptance Criteria
- [ ] Alumni can easily identify top candidates
- [ ] Invite flow is simple and fast
- [ ] Student privacy is respected (no contact info without consent)
- [ ] Analytics help alumni optimize referrals

---

## Task 7: Interactive Match Comparison

### Comparison Tool
- [ ] Compare multiple referrals side-by-side
- [ ] Highlight differences in match scores
- [ ] Show skill gaps for each
- [ ] Recommend best fit

### Comparison View
```tsx
<ReferralComparisonTable
  referrals={[referral1, referral2, referral3]}
  studentId={studentId}
  highlightBestMatch={true}
/>
```

**Features:**
- Up to 5 referrals compared at once
- Sticky header with referral titles
- Color-coded cells for quick scanning
- Export comparison as PDF

### Components Structure
```
/components/Matching/Comparison/
  ├── ComparisonTable.tsx
  ├── ComparisonHeader.tsx
  ├── ComparisonRow.tsx
  └── ExportComparison.tsx
```

### Acceptance Criteria
- [ ] Table is readable and not cluttered
- [ ] Responsive design (scrollable on mobile)
- [ ] Export includes all relevant data
- [ ] Best match is clearly indicated

---

## Task 8: Animations & Micro-interactions

### Animations to Implement
- [ ] Match score counting animation (0 → final score)
- [ ] Skill pill fade-in on card hover
- [ ] Recommendation card slide-in on load
- [ ] Match breakdown bar animation
- [ ] Confetti effect for 95%+ matches

### Micro-interactions
- [ ] Hover effects on match badges
- [ ] Click feedback on apply buttons
- [ ] Smooth transitions between views
- [ ] Loading skeletons during data fetch

### Implementation
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  <MatchScoreBadge score={score} />
</motion.div>
```

### Acceptance Criteria
- [ ] Animations are smooth (60fps)
- [ ] No janky transitions
- [ ] Respects reduced motion preferences
- [ ] Animations enhance, not distract

---

## Task 9: Accessibility & User Experience

### Accessibility Requirements
- [ ] All match scores have text alternatives
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader friendly announcements
- [ ] ARIA labels for complex visualizations
- [ ] Focus management in modals/dialogs

### UX Enhancements
- [ ] Contextual help tooltips
- [ ] Onboarding tour for first-time users
- [ ] Empty states with helpful guidance
- [ ] Error states with recovery actions
- [ ] Success states with next steps

### User Testing
- [ ] Usability testing with 5+ students
- [ ] A/B test match display formats
- [ ] Gather feedback on skill gap presentation
- [ ] Iterate based on user feedback

### Acceptance Criteria
- [ ] Lighthouse accessibility score >95
- [ ] Manual testing with screen reader passes
- [ ] User satisfaction score >4/5
- [ ] No critical UX issues identified

---

## Testing Requirements

### Unit Tests
- [ ] Component rendering tests
- [ ] Match score display logic
- [ ] Filter/sort functionality
- [ ] User interactions (clicks, hovers)

### Integration Tests
- [ ] API integration tests
- [ ] Match data fetching
- [ ] Recommendation feed updates
- [ ] Notification triggers

### Visual Regression Tests
- [ ] Snapshot tests for key components
- [ ] Responsive layout tests
- [ ] Theme compatibility tests

### E2E Tests
- [ ] Full user flow: View match → Analyze gap → Apply
- [ ] Alumni flow: Post referral → View matches → Invite
- [ ] Notification flow: Receive alert → View match → Apply

---

## Documentation

- [ ] Component documentation (Storybook)
- [ ] User guide: Understanding match scores
- [ ] User guide: Using skill gap analysis
- [ ] Developer setup instructions
- [ ] Design system integration notes

---

## Dependencies
- Backend matching API (`ai-matching-engine-backend.md`)
- Authentication context
- Notification service
- Analytics tracking

## Estimated Effort
**10-12 developer days**

## Related Issues
- `ai-matching-engine-backend.md` - Backend matching logic
- `analytics-dashboard-frontend.md` - Analytics integration
- `notification-enhancement-frontend.md` - Notification UI

---

**Note:** This issue depends on backend matching API being ready. Coordinate with backend team for API contracts and test data.
