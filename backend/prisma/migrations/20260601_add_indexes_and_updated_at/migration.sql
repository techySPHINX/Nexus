-- Migration: Add critical performance indexes and updatedAt fields
-- Issues: #199 (database indexes), #200 (updatedAt + soft-delete standardisation)
-- Date: 2026-06-01

-- ─────────────────────────────────────────────────────────────────────────────
-- Issue #200: Add updatedAt columns to models that were missing them.
-- We use CURRENT_TIMESTAMP as the DEFAULT so existing rows get a sensible
-- value; Prisma's @updatedAt directive keeps the column fresh on every write.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "connection"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "votes"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "comment"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "notification"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ─────────────────────────────────────────────────────────────────────────────
-- Issue #199: Add missing performance indexes.
-- All statements use CREATE INDEX IF NOT EXISTS to be idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

-- users -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "users_role_idx"                ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_accountStatus_idx"       ON "users"("accountStatus");
CREATE INDEX IF NOT EXISTS "users_isAccountActive_role_idx" ON "users"("isAccountActive", "role");
CREATE INDEX IF NOT EXISTS "users_createdAt_idx"           ON "users"("createdAt");

-- post ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "post_authorId_status_idx"               ON "post"("authorId", "status");
CREATE INDEX IF NOT EXISTS "post_authorId_createdAt_idx"            ON "post"("authorId", "createdAt");
CREATE INDEX IF NOT EXISTS "post_subCommunityId_status_createdAt_idx" ON "post"("subCommunityId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "post_status_createdAt_idx"              ON "post"("status", "createdAt");

-- comment ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "comment_postId_idx"                          ON "comment"("postId");
CREATE INDEX IF NOT EXISTS "comment_userId_idx"                          ON "comment"("userId");
CREATE INDEX IF NOT EXISTS "comment_postId_isDeleted_createdAt_idx"      ON "comment"("postId", "isDeleted", "createdAt");

-- votes -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "votes_postId_idx"    ON "votes"("postId");
CREATE INDEX IF NOT EXISTS "votes_userId_idx"    ON "votes"("userId");
CREATE INDEX IF NOT EXISTS "votes_commentId_idx" ON "votes"("commentId");

-- files -----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "files_userId_createdAt_idx" ON "files"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "files_uploadedBy_idx"       ON "files"("uploadedBy");

-- mentorship ------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "mentorship_mentorId_idx" ON "mentorship"("mentorId");
CREATE INDEX IF NOT EXISTS "mentorship_menteeId_idx" ON "mentorship"("menteeId");

-- refresh_tokens --------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "refresh_tokens_userId_isRevoked_idx" ON "refresh_tokens"("userId", "isRevoked");
CREATE INDEX IF NOT EXISTS "refresh_tokens_expiresAt_idx"        ON "refresh_tokens"("expiresAt");

-- login_attempts --------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "login_attempts_email_createdAt_idx"     ON "login_attempts"("email", "createdAt");
CREATE INDEX IF NOT EXISTS "login_attempts_ipAddress_createdAt_idx" ON "login_attempts"("ipAddress", "createdAt");
CREATE INDEX IF NOT EXISTS "login_attempts_success_createdAt_idx"   ON "login_attempts"("success", "createdAt");

-- security_events -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "security_events_userId_createdAt_idx"    ON "security_events"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "security_events_eventType_createdAt_idx" ON "security_events"("eventType", "createdAt");

-- user_sessions ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "user_sessions_userId_isActive_idx" ON "user_sessions"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "user_sessions_lastActivity_idx"    ON "user_sessions"("lastActivity");

-- verification_documents ------------------------------------------------------
CREATE INDEX IF NOT EXISTS "verification_documents_userId_status_idx" ON "verification_documents"("userId", "status");
CREATE INDEX IF NOT EXISTS "verification_documents_status_idx"        ON "verification_documents"("status");
CREATE INDEX IF NOT EXISTS "verification_documents_submittedAt_idx"   ON "verification_documents"("submittedAt");

-- SubCommunity (no @@map, table name is "SubCommunity") -----------------------
CREATE INDEX IF NOT EXISTS "SubCommunity_ownerId_idx"          ON "SubCommunity"("ownerId");
CREATE INDEX IF NOT EXISTS "SubCommunity_status_createdAt_idx" ON "SubCommunity"("status", "createdAt");

-- SubCommunityMember ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS "SubCommunityMember_subCommunityId_role_idx" ON "SubCommunityMember"("subCommunityId", "role");
CREATE INDEX IF NOT EXISTS "SubCommunityMember_userId_idx"               ON "SubCommunityMember"("userId");

-- JoinRequest -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "JoinRequest_subCommunityId_status_idx" ON "JoinRequest"("subCommunityId", "status");
CREATE INDEX IF NOT EXISTS "JoinRequest_userId_idx"                ON "JoinRequest"("userId");

-- events ----------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "events_authorId_status_idx" ON "events"("authorId", "status");
CREATE INDEX IF NOT EXISTS "events_status_date_idx"     ON "events"("status", "date");
CREATE INDEX IF NOT EXISTS "events_date_idx"            ON "events"("date");

-- mentorship_listings ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS "mentorship_listings_mentorId_status_idx" ON "mentorship_listings"("mentorId", "status");
CREATE INDEX IF NOT EXISTS "mentorship_listings_status_idx"          ON "mentorship_listings"("status");

-- mentorship_applications -----------------------------------------------------
CREATE INDEX IF NOT EXISTS "mentorship_applications_listingId_status_idx" ON "mentorship_applications"("listingId", "status");
CREATE INDEX IF NOT EXISTS "mentorship_applications_menteeId_status_idx"  ON "mentorship_applications"("menteeId", "status");

-- meetings --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "meetings_mentorshipId_status_idx" ON "meetings"("mentorshipId", "status");
CREATE INDEX IF NOT EXISTS "meetings_startTime_idx"           ON "meetings"("startTime");

-- point_transactions ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS "point_transactions_userId_createdAt_idx" ON "point_transactions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "point_transactions_type_idx"             ON "point_transactions"("type");
