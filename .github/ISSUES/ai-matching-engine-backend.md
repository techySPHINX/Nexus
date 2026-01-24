# 🤖 Backend: AI-Powered Referral Matching Engine

## Overview
Develop an intelligent matching system that analyzes student skills, referral requirements, and historical data to generate match scores and recommendations.

## Priority
**Medium** - Enhancement feature, not critical path

## Tech Stack
- NestJS service
- Natural Language Processing (compromise.js or alternative)
- PostgreSQL full-text search
- Redis caching for match results
- Background job processing (Bull Queue)

---

## Task 1: Skill Extraction & Normalization

### Backend Implementation
- [ ] Create `SkillExtractor` service for parsing job descriptions
- [ ] Implement keyword extraction algorithm
- [ ] Build skill taxonomy/dictionary for normalization
- [ ] Add synonym mapping for skill matching
- [ ] Cache extracted skills per referral

### NLP Requirements
- Extract technical skills (programming languages, frameworks, tools)
- Identify soft skills (leadership, communication, etc.)
- Recognize experience level requirements (junior, mid, senior)
- Parse education requirements
- Detect location/timezone requirements

### Database Schema
```prisma
model SkillTaxonomy {
  id          String   @id @default(cuid())
  skill       String   @unique
  category    String   // Technical, Soft, Domain
  synonyms    String[] // Alternative names
  level       String?  // Junior, Mid, Senior
  createdAt   DateTime @default(now())
}

model ExtractedSkills {
  id             String   @id @default(cuid())
  referralId     String
  referral       Referral @relation(fields: [referralId], references: [id])
  skills         Json     // Array of {skill, weight, category}
  requirements   Json     // Structured requirements
  extractedAt    DateTime @default(now())
  
  @@unique([referralId])
}
```

### API Endpoints
```
POST /matching/extract-skills
  Body: { referralId: string }
  Response: { skills: Skill[], requirements: Requirements }

GET /matching/skill-taxonomy
  Response: SkillTaxonomy[]
```

### Acceptance Criteria
- [ ] Extracts skills with >80% accuracy (manually validated)
- [ ] Handles various job description formats
- [ ] Normalizes similar skills (e.g., "JS" → "JavaScript")
- [ ] Caches results to avoid re-processing
- [ ] Unit tests for extraction accuracy

---

## Task 2: Student Profile Skill Indexing

### Backend Implementation
- [ ] Index student skills from profiles
- [ ] Parse resume text for additional skills
- [ ] Build student skill graph (skills + proficiency)
- [ ] Update skill index on profile changes
- [ ] Implement skill verification system (optional)

### Student Skill Model
```prisma
model StudentSkillProfile {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id])
  skills            Json      // [{skill, proficiency, verified, source}]
  resumeSkills      Json      // Skills parsed from resume
  endorsedSkills    Json      // Skills endorsed by others
  lastUpdated       DateTime  @default(now())
  indexVersion      Int       @default(1)
}
```

### Skill Sources
1. Profile self-reported skills
2. Resume/CV parsing
3. Completed projects
4. Endorsements from connections
5. Course completions (if available)

### API Endpoints
```
POST /matching/index-student-skills/:userId
GET /matching/student-skills/:userId
PUT /matching/update-student-skills/:userId
```

### Acceptance Criteria
- [ ] All student skills indexed and searchable
- [ ] Skill index updates automatically on profile changes
- [ ] Supports proficiency levels (Beginner, Intermediate, Advanced, Expert)
- [ ] Performance: Index 1000+ students in <10s

---

## Task 3: Match Score Calculation Algorithm

### Matching Algorithm Design
- [ ] Define match score formula (0-100 scale)
- [ ] Implement skill overlap calculation
- [ ] Add experience level matching
- [ ] Factor in education requirements
- [ ] Consider location compatibility
- [ ] Weight historical success patterns

### Score Components
```typescript
interface MatchScore {
  totalScore: number;        // 0-100
  breakdown: {
    skillMatch: number;      // 0-40 points
    experienceMatch: number; // 0-20 points
    educationMatch: number;  // 0-15 points
    locationMatch: number;   // 0-10 points
    profileStrength: number; // 0-10 points
    historicalFit: number;   // 0-5 points (ML component)
  };
  confidence: number;        // 0-1 (algorithm confidence)
  explanation: string;       // Human-readable reason
}
```

### Algorithm Logic
```
1. Skill Match (40 points):
   - Required skills present: +30
   - Bonus skills present: +10
   - Proficiency level match: multiplier

2. Experience Match (20 points):
   - Years of experience match: +15
   - Relevant roles/projects: +5

3. Education Match (15 points):
   - Degree level match: +10
   - Major/field match: +5

4. Location Match (10 points):
   - Same city: +10
   - Same region: +7
   - Remote available: +10

5. Profile Strength (10 points):
   - Profile completeness: +5
   - Endorsements/recommendations: +5

6. Historical Fit (5 points):
   - Past successful matches: +5
```

### API Endpoints
```
POST /matching/calculate-score
  Body: { studentId: string, referralId: string }
  Response: MatchScore

POST /matching/batch-calculate
  Body: { studentIds: string[], referralId: string }
  Response: MatchScore[]
```

### Acceptance Criteria
- [ ] Score consistently ranks relevant matches higher
- [ ] Explanation provides actionable insights
- [ ] Performance: Calculate single match in <100ms
- [ ] Batch calculate 100 matches in <3s
- [ ] Unit tests validate scoring logic

---

## Task 4: Skill Gap Analysis

### Gap Analysis Service
- [ ] Compare student skills vs referral requirements
- [ ] Identify missing required skills
- [ ] Suggest learning paths for gap closure
- [ ] Calculate "gap closure time" estimate
- [ ] Recommend relevant courses/resources

### Gap Analysis Output
```typescript
interface SkillGap {
  missingSkills: Array<{
    skill: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    alternatives: string[];
    learningResources: Resource[];
    estimatedTimeToLearn: string; // e.g., "2-4 weeks"
  }>;
  strengthAreas: string[];      // Where student exceeds requirements
  improvementAreas: string[];   // Where student meets but could improve
  overallReadiness: number;     // 0-100
  recommendation: string;       // Apply now / Learn first / Consider alternatives
}
```

### API Endpoints
```
GET /matching/skill-gap/:studentId/:referralId
POST /matching/learning-path
  Body: { studentId: string, targetSkills: string[] }
  Response: LearningPath
```

### Acceptance Criteria
- [ ] Accurately identifies skill gaps
- [ ] Provides actionable learning recommendations
- [ ] Supports multiple learning resource types
- [ ] Estimates realistic learning timelines

---

## Task 5: Match Recommendations & Ranking

### Recommendation Engine
- [ ] Find top N matches for a referral
- [ ] Find top N referrals for a student
- [ ] Implement ranking algorithm (score + recency + fit)
- [ ] Add filtering options (min score, location, etc.)
- [ ] Cache recommendations with TTL

### Ranking Factors
- Match score (primary)
- Recency of referral posting
- Application deadline proximity
- Referral poster reputation
- Historical interaction patterns

### API Endpoints
```
GET /matching/recommendations/for-referral/:referralId
  Query: ?limit=10&minScore=70
  Response: RankedStudent[]

GET /matching/recommendations/for-student/:studentId
  Query: ?limit=10&minScore=70
  Response: RankedReferral[]

GET /matching/top-matches
  Query: ?role=STUDENT&limit=20
  Response: TopMatch[]
```

### Caching Strategy
- Cache recommendations for 1 hour
- Invalidate on profile updates
- Warm cache for active referrals
- Background job for cache refresh

### Acceptance Criteria
- [ ] Recommendations are relevant and personalized
- [ ] Response time <500ms (cached)
- [ ] Supports pagination for large result sets
- [ ] Cache hit rate >80%

---

## Task 6: Background Processing & Notifications

### Job Queue Setup
- [ ] Set up Bull queue for async processing
- [ ] Create job for daily match recalculation
- [ ] Implement new referral notification job
- [ ] Build high-match alert job

### Jobs to Implement
1. **Daily Match Refresh**
   - Recalculate match scores for all active referrals
   - Run during off-peak hours
   - Update recommendation cache

2. **New Referral Notifications**
   - When referral posted, find top 10 matches
   - Send email/push to matched students
   - Rate limit to avoid spam

3. **High Match Alerts**
   - Monitor for >90% match scores
   - Immediate notification to both parties
   - Track notification engagement

### API Endpoints
```
POST /matching/trigger-match-refresh (Admin only)
GET /matching/job-status/:jobId
```

### Acceptance Criteria
- [ ] Jobs run reliably on schedule
- [ ] Failed jobs retry with exponential backoff
- [ ] Job status visible in admin dashboard
- [ ] Notifications sent within 5 minutes of trigger

---

## Task 7: Analytics & Monitoring

### Metrics to Track
- [ ] Match score distribution (histogram)
- [ ] Average match scores by industry/role
- [ ] Skill gap trends
- [ ] Recommendation click-through rates
- [ ] Successful application correlation with match score

### Admin Dashboard Endpoints
```
GET /matching/analytics/match-score-distribution
GET /matching/analytics/top-skills-demand
GET /matching/analytics/gap-analysis-summary
GET /matching/analytics/recommendation-performance
```

### Monitoring & Logging
- Log all match calculations
- Track algorithm performance (latency, accuracy)
- Alert on algorithm failures
- A/B testing framework for algorithm improvements

### Acceptance Criteria
- [ ] Analytics provide actionable insights
- [ ] Performance metrics tracked over time
- [ ] Algorithm improvements measurable
- [ ] Admin can monitor matching health

---

## Testing Requirements

### Unit Tests
- [ ] Skill extraction accuracy tests
- [ ] Match score calculation tests
- [ ] Gap analysis logic tests
- [ ] Ranking algorithm tests

### Integration Tests
- [ ] End-to-end matching flow
- [ ] API endpoint tests
- [ ] Background job tests
- [ ] Cache invalidation tests

### Performance Tests
- [ ] Match calculation under load
- [ ] Bulk recommendation generation
- [ ] Cache effectiveness
- [ ] Database query optimization

### Validation Tests
- [ ] Manual validation of match scores (sample set)
- [ ] Skill extraction accuracy (benchmark dataset)
- [ ] Gap analysis usefulness (user feedback)

---

## Documentation

- [ ] Matching algorithm documentation
- [ ] Skill taxonomy and normalization rules
- [ ] API endpoint documentation
- [ ] Admin guide for monitoring and tuning
- [ ] User-facing explanation of match scores

---

## Dependencies
- Referral and user profile data
- NLP library (compromise.js or similar)
- Bull queue infrastructure
- Redis for caching
- Email/notification service

## Estimated Effort
**15-18 developer days**

## Future Enhancements
- Machine learning model for match prediction
- Collaborative filtering (users like you applied to...)
- Feedback loop to improve algorithm
- Integration with external skill assessment platforms

## Related Issues
- `referral-matching-frontend.md` - Frontend UI for matches
- `analytics-dashboard-backend.md` - Analytics integration
- `notification-enhancement.md` - Notification system

---

**Note:** This is a complex feature. Consider implementing in phases:
1. Phase 1: Basic skill extraction and scoring (Tasks 1-3)
2. Phase 2: Recommendations and gap analysis (Tasks 4-5)
3. Phase 3: Background processing and analytics (Tasks 6-7)
