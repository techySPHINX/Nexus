-- CreateEnum for UserActionType
CREATE TYPE "UserActionType" AS ENUM ('WARNING', 'TEMPORARY_BAN', 'PERMANENT_BAN', 'RESTRICT_POSTING', 'REMOVE_PRIVILEGES', 'CONTENT_REMOVAL');

-- CreateEnum for ModerationActionType
CREATE TYPE "ModerationActionType" AS ENUM ('REPORT_CREATED', 'REPORT_RESOLVED', 'REPORT_DISMISSED', 'CONTENT_DELETED', 'USER_ACTION_TAKEN', 'USER_ACTION_REVERTED', 'BATCH_OPERATION');

-- CreateTable for UserAction (tracks all punitive actions against users)
CREATE TABLE "user_actions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" "UserActionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "reportId" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable for ModerationLog (audit trail for all moderation actions)
CREATE TABLE "moderation_logs" (
    "id" TEXT NOT NULL,
    "actionType" "ModerationActionType" NOT NULL,
    "performedById" TEXT NOT NULL,
    "targetUserId" TEXT,
    "reportId" TEXT,
    "postId" TEXT,
    "commentId" TEXT,
    "details" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_actions_userId_isActive_idx" ON "user_actions"("userId", "isActive");
CREATE INDEX "user_actions_reportId_idx" ON "user_actions"("reportId");
CREATE INDEX "user_actions_adminId_idx" ON "user_actions"("adminId");
CREATE INDEX "user_actions_expiresAt_idx" ON "user_actions"("expiresAt");

CREATE INDEX "moderation_logs_performedById_idx" ON "moderation_logs"("performedById");
CREATE INDEX "moderation_logs_targetUserId_idx" ON "moderation_logs"("targetUserId");
CREATE INDEX "moderation_logs_reportId_idx" ON "moderation_logs"("reportId");
CREATE INDEX "moderation_logs_createdAt_idx" ON "moderation_logs"("createdAt");
CREATE INDEX "moderation_logs_actionType_idx" ON "moderation_logs"("actionType");

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ContentReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_revokedBy_fkey" FOREIGN KEY ("revokedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ContentReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "moderation_logs" ADD CONSTRAINT "moderation_logs_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add soft delete columns to Post and Comment
ALTER TABLE "Post" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Post" ADD COLUMN "deletedBy" TEXT;
ALTER TABLE "Post" ADD COLUMN "deletionReason" TEXT;

ALTER TABLE "comment" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "comment" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "comment" ADD COLUMN "deletedBy" TEXT;
ALTER TABLE "comment" ADD COLUMN "deletionReason" TEXT;

-- Add indexes for soft deletes
CREATE INDEX "Post_isDeleted_idx" ON "Post"("isDeleted");
CREATE INDEX "comment_isDeleted_idx" ON "comment"("isDeleted");

-- Add foreign keys for deleted by
ALTER TABLE "Post" ADD CONSTRAINT "Post_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comment" ADD CONSTRAINT "comment_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
