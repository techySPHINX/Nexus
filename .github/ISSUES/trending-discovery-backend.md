# 🔥 Backend: Trending & Discovery System

## Overview
Implement intelligent trending algorithms to surface popular content, discover emerging topics, and recommend relevant communities to users.

## Priority
**Medium** - Engagement enhancement feature

## Tech Stack
- NestJS service
- PostgreSQL with time-window queries
- Redis for caching and scoring
- Background jobs for periodic recalculation
- Full-text search for topic extraction

---

## Task 1: Trending Posts Algorithm

### Algorithm Design
- [ ] Define "trending score" formula considering:
  - Engagement velocity (votes/comments per time unit)
  - Recency decay factor
  - View count acceleration
  - Creator reputation bonus
  - Time-weighted scoring

### Scoring Formula
```typescript
TrendingScore = (
  (upvotes * 2 + comments * 3 + views * 0.1) / 
  pow(hoursSinceCreated + 2, 1.5)
) * creatorReputationMultiplier
```

### Implementation
- [ ] Create `TrendingService` with scoring methods
- [ ] Build CRON job to recalculate scores hourly
- [ ] Store scores in `TrendingCache` model
- [ ] Implement decay mechanism for old posts

### Database Schema
```prisma
model TrendingCache {
  id            String   @id @default(cuid())
  contentType   String   // POST, COMMUNITY, TOPIC
  contentId     String
  score         Float
  rank          Int
  period        String   // HOUR, DAY, WEEK
  calculatedAt  DateTime @default(now())
  
  @@unique([contentType, contentId, period])
  @@index([contentType, period, score])
}
```

### API Endpoints
```
GET /trending/posts?period=day&limit=20
GET /trending/posts/:postId/score
POST /trending/recalculate (Admin only)
```

### Acceptance Criteria
- [ ] Trending posts refresh hourly
- [ ] Algorithm balances recency and popularity
- [ ] Response time <200ms (cached)
- [ ] Trending list updates smoothly, no sudden jumps

---

## Task 2: Hot Topics Detection

### Topic Extraction
- [ ] Extract keywords/phrases from posts using NLP
- [ ] Identify hashtags and mentions
- [ ] Group related keywords into topics
- [ ] Track topic frequency over time windows

### Implementation
- [ ] Integrate keyword extraction library
- [ ] Build topic clustering algorithm
- [ ] Create trending topics table
- [ ] Calculate topic velocity (trending up/down)

### Database Schema
```prisma
model TrendingTopic {
  id              String   @id @default(cuid())
  topic           String   @unique
  relatedKeywords String[]
  postCount       Int
  engagementCount Int
  velocity        Float    // Rate of growth
  trendDirection  String   // UP, DOWN, STABLE
  firstSeenAt     DateTime
  lastSeenAt      DateTime @default(now())
  
  @@index([velocity, lastSeenAt])
}
```

### API Endpoints
```
GET /trending/topics?period=week&limit=10
GET /trending/topics/:topic/posts
GET /trending/topics/rising
```

### Acceptance Criteria
- [ ] Topics accurately represent current discussions
- [ ] Velocity correctly indicates trending direction
- [ ] Related posts linkage works
- [ ] Spam/irrelevant topics filtered out

---

## Task 3: Community Discovery & Recommendations

### Recommendation Engine
- [ ] Analyze user interests from:
  - Joined communities
  - Post engagement history
  - Profile information
  - Connection network
- [ ] Find similar communities
- [ ] Rank by relevance and activity level

### Ranking Factors
1. Interest overlap with user
2. Community activity level (posts/day)
3. Member growth rate
4. Friend connections in community
5. Topic similarity score

### Database Schema
```prisma
model CommunityRecommendation {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  communityId    String
  community      SubCommunity @relation(fields: [communityId], references: [id])
  score          Float
  reason         String   // Why recommended
  createdAt      DateTime @default(now())
  
  @@unique([userId, communityId])
  @@index([userId, score])
}
```

### API Endpoints
```
GET /discovery/communities/recommended?userId=X&limit=10
GET /discovery/communities/rising
GET /discovery/communities/by-interest?interest=tech
```

### Caching Strategy
- Cache recommendations per user for 6 hours
- Invalidate on user activity changes
- Warm cache for active users
- Background job refreshes nightly

### Acceptance Criteria
- [ ] Recommendations are personalized and relevant
- [ ] Includes mix of similar and exploratory suggestions
- [ ] Response time <300ms (cached)
- [ ] Click-through rate >10% (track in analytics)

---

## Task 4: Rising Communities Detection

### Algorithm
- [ ] Calculate community growth metrics:
  - New members per period
  - Post frequency increase
  - Engagement rate improvement
- [ ] Identify "breakout" communities
- [ ] Rank by growth velocity

### Metrics
```typescript
interface CommunityGrowthMetrics {
  memberGrowthRate: number;    // % change
  postGrowthRate: number;
  engagementGrowthRate: number;
  newMemberRetention: number;  // % still active after 7 days
  overallMomentum: number;     // Composite score
}
```

### Implementation
- [ ] CRON job calculates metrics daily
- [ ] Store in time-series format
- [ ] API endpoints for rising communities
- [ ] Admin dashboard for monitoring

### API Endpoints
```
GET /discovery/communities/rising?period=week&limit=15
GET /discovery/communities/:id/growth-metrics
```

### Acceptance Criteria
- [ ] Rising communities list is dynamic
- [ ] Metrics accurately reflect growth
- [ ] Supports multiple time periods (day, week, month)
- [ ] Performance: Calculate all communities in <30s

---

## Task 5: Personalized Content Feed

### Feed Algorithm
- [ ] Combine multiple signals:
  - Communities user joined
  - Users they follow (if feature exists)
  - Posts they engaged with
  - Trending content
- [ ] Balance relevance vs diversity
- [ ] Implement feed ranking and pagination

### Ranking Factors
```typescript
FeedScore = 
  (relevanceScore * 0.4) +
  (freshnessScore * 0.3) +
  (popularityScore * 0.2) +
  (diversityBonus * 0.1)
```

### Implementation
- [ ] Create `FeedService` for personalization
- [ ] Build feed generation pipeline
- [ ] Cache feeds per user (TTL: 5min)
- [ ] Implement "refresh feed" logic

### API Endpoints
```
GET /discovery/feed?userId=X&page=1&limit=20
POST /discovery/feed/refresh?userId=X
GET /discovery/feed/preview?userId=X (First 5, no auth required)
```

### Acceptance Criteria
- [ ] Feed is personalized and engaging
- [ ] Balances familiar and new content
- [ ] Fast initial load (<500ms)
- [ ] Infinite scroll pagination works smoothly

---

## Task 6: Search Enhancement

### Improved Search
- [ ] Implement full-text search across posts, communities, users
- [ ] Add search result ranking by relevance
- [ ] Integrate trending topics into search suggestions
- [ ] Track search queries for analytics

### Features
- [ ] Auto-complete search suggestions
- [ ] Search filters (content type, date range, community)
- [ ] Highlighted search terms in results
- [ ] "People also searched for" suggestions

### Database Schema
```prisma
model SearchQuery {
  id         String   @id @default(cuid())
  userId     String?
  query      String
  resultCount Int
  clickedResults String[] // IDs of clicked results
  createdAt  DateTime @default(now())
  
  @@index([query, createdAt])
}
```

### API Endpoints
```
GET /search?q=keyword&type=posts&page=1
GET /search/suggest?q=key
GET /search/trending-queries
```

### Acceptance Criteria
- [ ] Search is fast (<300ms)
- [ ] Results are relevant (manual validation)
- [ ] Auto-complete is responsive
- [ ] Search analytics tracked

---

## Task 7: Background Jobs & Caching

### Jobs to Implement
1. **Trending Score Recalculation** (Every hour)
   - Update trending posts scores
   - Update trending topics
   - Prune old trending data

2. **Community Recommendations** (Daily)
   - Recalculate recommendations for active users
   - Update rising communities list
   - Warm cache for popular queries

3. **Feed Cache Refresh** (Every 10 minutes)
   - Regenerate feeds for recently active users
   - Clear stale feed caches
   - Preload feeds for peak hours

### Caching Strategy
- **Trending Posts:** 1 hour TTL
- **Hot Topics:** 30 min TTL
- **Community Recommendations:** 6 hours TTL
- **Rising Communities:** 12 hours TTL
- **User Feed:** 5 min TTL

### Implementation
- [ ] Set up Bull queue for background jobs
- [ ] Configure Redis caching
- [ ] Implement cache warming strategies
- [ ] Add job monitoring and alerts

### Acceptance Criteria
- [ ] Jobs run on schedule reliably
- [ ] Cache hit rate >85%
- [ ] Failed jobs retry automatically
- [ ] Job dashboard shows health status

---

## Task 8: Analytics & Monitoring

### Metrics to Track
- [ ] Trending algorithm performance
  - Click-through rate on trending posts
  - Time spent on trending content
  - User engagement with trending items
  
- [ ] Discovery effectiveness
  - Community recommendation acceptance rate
  - Search query success rate
  - Feed engagement metrics

### Admin Dashboard Endpoints
```
GET /analytics/trending/performance
GET /analytics/discovery/recommendations-stats
GET /analytics/discovery/search-trends
GET /analytics/discovery/feed-engagement
```

### Monitoring
- Track algorithm execution times
- Alert on cache misses >20%
- Monitor job queue backlogs
- Log anomalies in trending scores

### Acceptance Criteria
- [ ] Analytics provide actionable insights
- [ ] Monitoring catches issues proactively
- [ ] Admin dashboard is comprehensive
- [ ] Performance metrics tracked over time

---

## Testing Requirements

### Unit Tests
- [ ] Trending score calculation tests
- [ ] Topic extraction accuracy tests
- [ ] Recommendation ranking tests
- [ ] Feed generation logic tests

### Integration Tests
- [ ] API endpoint tests
- [ ] Background job tests
- [ ] Caching behavior tests
- [ ] Search functionality tests

### Performance Tests
- [ ] Trending calculation under load
- [ ] Feed generation for 1000+ users
- [ ] Search with large datasets
- [ ] Cache performance benchmarks

### A/B Testing
- [ ] Test different trending algorithms
- [ ] Compare recommendation strategies
- [ ] Optimize feed ranking factors

---

## Documentation

- [ ] Trending algorithm documentation
- [ ] API endpoint documentation
- [ ] Caching strategy guide
- [ ] Admin monitoring guide

---

## Dependencies
- Post and community data
- User engagement data
- NLP library for topic extraction
- Bull queue setup
- Redis infrastructure

## Estimated Effort
**12-14 developer days**

## Future Enhancements
- Machine learning for personalization
- Real-time trending updates (WebSocket)
- Geographic trending (by location)
- Collaborative filtering recommendations

## Related Issues
- `trending-discovery-frontend.md` - Frontend UI
- `analytics-dashboard-backend.md` - Analytics integration
- `search-enhancement-frontend.md` - Search UI

---

**Note:** Consider phased implementation:
1. Phase 1: Basic trending posts (Tasks 1-2)
2. Phase 2: Discovery and recommendations (Tasks 3-5)
3. Phase 3: Search and optimization (Tasks 6-8)
