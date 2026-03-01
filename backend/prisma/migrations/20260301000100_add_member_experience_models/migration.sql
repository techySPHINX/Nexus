-- CreateTable
CREATE TABLE "member_profiles" (
	"id" TEXT NOT NULL,
	"userId" TEXT NOT NULL,
	"headline" TEXT,
	"pronouns" TEXT,
	"websiteUrl" TEXT,
	"customStatus" TEXT,
	"showBadges" BOOLEAN NOT NULL DEFAULT true,
	"showRecentActivity" BOOLEAN NOT NULL DEFAULT true,
	"allowFollowers" BOOLEAN NOT NULL DEFAULT true,
	"allowDirectMessage" BOOLEAN NOT NULL DEFAULT true,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "member_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_follows" (
	"id" TEXT NOT NULL,
	"followerId" TEXT NOT NULL,
	"followedId" TEXT NOT NULL,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

	CONSTRAINT "community_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_flairs" (
	"id" TEXT NOT NULL,
	"userId" TEXT NOT NULL,
	"label" TEXT NOT NULL,
	"color" TEXT NOT NULL DEFAULT '#7C3AED',
	"backgroundColor" TEXT NOT NULL DEFAULT '#EDE9FE',
	"isActive" BOOLEAN NOT NULL DEFAULT true,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "member_flairs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
	"id" TEXT NOT NULL,
	"userId" TEXT NOT NULL,
	"emailEnabled" BOOLEAN NOT NULL DEFAULT true,
	"pushEnabled" BOOLEAN NOT NULL DEFAULT true,
	"inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
	"digestModeEnabled" BOOLEAN NOT NULL DEFAULT false,
	"digestFrequency" TEXT NOT NULL DEFAULT 'DAILY',
	"notifyOnFollow" BOOLEAN NOT NULL DEFAULT true,
	"notifyOnFlairAssign" BOOLEAN NOT NULL DEFAULT true,
	"notifyOnBadgeAward" BOOLEAN NOT NULL DEFAULT true,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_profiles_userId_key" ON "member_profiles"("userId");
CREATE INDEX "member_profiles_userId_idx" ON "member_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "community_follows_followerId_followedId_key" ON "community_follows"("followerId", "followedId");
CREATE INDEX "community_follows_followerId_idx" ON "community_follows"("followerId");
CREATE INDEX "community_follows_followedId_idx" ON "community_follows"("followedId");
CREATE INDEX "community_follows_createdAt_idx" ON "community_follows"("createdAt");

-- CreateIndex
CREATE INDEX "member_flairs_userId_isActive_idx" ON "member_flairs"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "member_profiles" ADD CONSTRAINT "member_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_follows" ADD CONSTRAINT "community_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_follows" ADD CONSTRAINT "community_follows_followedId_fkey" FOREIGN KEY ("followedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_flairs" ADD CONSTRAINT "member_flairs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
