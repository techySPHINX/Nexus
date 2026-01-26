-- Migration: Add critical database indexes for performance
-- Description: Adds indexes for frequently queried fields to improve performance
-- Date: 2026-01-26

-- Messages: Add indexes for conversation queries
CREATE INDEX IF NOT EXISTS "message_senderId_receiverId_idx" ON "message"("senderId", "receiverId");
CREATE INDEX IF NOT EXISTS "message_receiverId_timestamp_idx" ON "message"("receiverId", "timestamp");
CREATE INDEX IF NOT EXISTS "message_senderId_timestamp_idx" ON "message"("senderId", "timestamp");
CREATE INDEX IF NOT EXISTS "message_timestamp_idx" ON "message"("timestamp");

-- Connections: Add indexes for connection status queries
CREATE INDEX IF NOT EXISTS "connection_requesterId_status_idx" ON "connection"("requesterId", "status");
CREATE INDEX IF NOT EXISTS "connection_recipientId_status_idx" ON "connection"("recipientId", "status");
CREATE INDEX IF NOT EXISTS "connection_status_createdAt_idx" ON "connection"("status", "createdAt");

-- Notifications: Add indexes for user notification queries
CREATE INDEX IF NOT EXISTS "notification_userId_read_idx" ON "notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "notification_userId_createdAt_idx" ON "notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "notification_createdAt_idx" ON "notification"("createdAt");

-- Referrals: Add indexes for referral queries
CREATE INDEX IF NOT EXISTS "referrals_alumniId_idx" ON "referrals"("alumniId");
CREATE INDEX IF NOT EXISTS "referrals_status_createdAt_idx" ON "referrals"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "referrals_company_idx" ON "referrals"("company");
CREATE INDEX IF NOT EXISTS "referrals_location_idx" ON "referrals"("location");
CREATE INDEX IF NOT EXISTS "referrals_deadline_idx" ON "referrals"("deadline");

-- Referral Applications: Add indexes for application queries
CREATE INDEX IF NOT EXISTS "referral_applications_referralId_status_idx" ON "referral_applications"("referralId", "status");
CREATE INDEX IF NOT EXISTS "referral_applications_applicantId_idx" ON "referral_applications"("applicantId");
CREATE INDEX IF NOT EXISTS "referral_applications_status_createdAt_idx" ON "referral_applications"("status", "createdAt");

-- Add constraint to ensure unique referral application per user
CREATE UNIQUE INDEX IF NOT EXISTS "referral_applications_referralId_applicantId_key" 
ON "referral_applications"("referralId", "applicantId");

-- Analyze tables to update statistics
ANALYZE "message";
ANALYZE "connection";
ANALYZE "notification";
ANALYZE "referrals";
ANALYZE "referral_applications";
