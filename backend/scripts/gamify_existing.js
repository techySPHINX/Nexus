#!/usr/bin/env node
/*
  Script: gamify_existing.js
  Purpose: Scan existing projects, startups, referrals and various comment tables
           and idempotently award gamification points for historical items.

  Usage:
    node backend/scripts/gamify_existing.js

  Notes:
  - This script is idempotent: it checks for an existing pointTransaction
    with the same userId + type + entityId before creating a new transaction.
  - It performs upserts on `userPoints` and creates `pointTransaction` rows
    inside a transaction to keep data consistent.
  - Run on the backend machine where the database is accessible.
*/

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const EVENTS = {
  PROJECT_CREATED: 'PROJECT_CREATED',
  STARTUP_CREATED: 'STARTUP_CREATED',
  REFERRAL_POSTED: 'REFERRAL_POSTED',
  COMMENT_CREATED: 'COMMENT_CREATED',
  COMMENT_REPLY: 'COMMENT_REPLY',
  PROJECT_COMMENT: 'PROJECT_COMMENT',
  STARTUP_COMMENT: 'STARTUP_COMMENT',
};

async function ensureAward(userId, points, type, entityId, createdAt) {
  if (!userId) return false;

  // check if a transaction for this (user,type,entity) already exists
  const exists = await prisma.pointTransaction.findFirst({
    where: { userId, type, entityId: entityId ?? null },
  });
  if (exists) return false;

  await prisma.$transaction(async (tx) => {
    const userPoints = await tx.userPoints.upsert({
      where: { userId },
      update: { points: { increment: points } },
      create: { userId, points },
      select: { id: true, userId: true, points: true },
    });

    await tx.pointTransaction.create({
      data: {
        userId,
        userPointsId: userPoints.id,
        points,
        type,
        entityId: entityId ?? null,
        createdAt: createdAt ? new Date(createdAt) : undefined,
      },
    });
  });

  return true;
}

async function process() {
  console.log('Starting gamification backfill...');

  const summary = {};
  const bump = (k) => (summary[k] = (summary[k] || 0) + 1);

  // Projects: award PROJECT_CREATED to ownerId (20 pts)
  const projects = await prisma.project.findMany({ select: { id: true, ownerId: true, createdAt: true } });
  console.log(`Found ${projects.length} projects`);
  for (const p of projects) {
    try {
      const ok = await ensureAward(p.ownerId, 20, EVENTS.PROJECT_CREATED, p.id, p.createdAt);
      if (ok) bump(EVENTS.PROJECT_CREATED);
    } catch (e) {
      console.error('Error awarding project', p.id, e.message || e);
    }
  }

  // Startups: award STARTUP_CREATED to founderId (50 pts)
  const startups = await prisma.startup.findMany({ select: { id: true, founderId: true, createdAt: true } });
  console.log(`Found ${startups.length} startups`);
  for (const s of startups) {
    try {
      const ok = await ensureAward(s.founderId, 50, EVENTS.STARTUP_CREATED, s.id, s.createdAt);
      if (ok) bump(EVENTS.STARTUP_CREATED);
    } catch (e) {
      console.error('Error awarding startup', s.id, e.message || e);
    }
  }

  // Referrals: award REFERRAL_POSTED to alumniId (60 pts)
  const referrals = await prisma.referral.findMany({ select: { id: true, alumniId: true, createdAt: true } });
  console.log(`Found ${referrals.length} referrals`);
  for (const r of referrals) {
    try {
      const ok = await ensureAward(r.alumniId, 60, EVENTS.REFERRAL_POSTED, r.id, r.createdAt);
      if (ok) bump(EVENTS.REFERRAL_POSTED);
    } catch (e) {
      console.error('Error awarding referral', r.id, e.message || e);
    }
  }

  // General comments: comment table
  const comments = await prisma.comment.findMany({ select: { id: true, userId: true, parentId: true, createdAt: true } });
  console.log(`Found ${comments.length} post comments`);
  for (const c of comments) {
    try {
      if (c.parentId) {
        const ok = await ensureAward(c.userId, 2, EVENTS.COMMENT_REPLY, c.id, c.createdAt);
        if (ok) bump(EVENTS.COMMENT_REPLY);
      } else {
        const ok = await ensureAward(c.userId, 4, EVENTS.COMMENT_CREATED, c.id, c.createdAt);
        if (ok) bump(EVENTS.COMMENT_CREATED);
      }
    } catch (e) {
      console.error('Error awarding comment', c.id, e.message || e);
    }
  }

  // Project comments (projectComment table)
  const projectCommentsExist = await prisma.$queryRaw`SELECT to_regclass('public.project_comment') IS NOT NULL as exists`;
  // The above raw check may not work across DBs; fall back to try/catch
  let projectComments = [];
  try {
    projectComments = await prisma.projectComment.findMany({ select: { id: true, userId: true, createdAt: true } });
    console.log(`Found ${projectComments.length} project comments`);
    for (const pc of projectComments) {
      try {
        const ok = await ensureAward(pc.userId, 4, EVENTS.PROJECT_COMMENT, pc.id, pc.createdAt);
        if (ok) bump(EVENTS.PROJECT_COMMENT);
      } catch (e) {
        console.error('Error awarding projectComment', pc.id, e.message || e);
      }
    }
  } catch (e) {
    // ignore if table doesn't exist
  }

  // Startup comments (startupComment table)
  try {
    const startupComments = await prisma.startupComment.findMany({ select: { id: true, userId: true, createdAt: true } });
    console.log(`Found ${startupComments.length} startup comments`);
    for (const sc of startupComments) {
      try {
        const ok = await ensureAward(sc.userId, 4, EVENTS.STARTUP_COMMENT, sc.id, sc.createdAt);
        if (ok) bump(EVENTS.STARTUP_COMMENT);
      } catch (e) {
        console.error('Error awarding startupComment', sc.id, e.message || e);
      }
    }
  } catch (e) {
    // ignore if table doesn't exist
  }

  console.log('\nBackfill complete. Summary:');
  for (const k of Object.keys(summary)) {
    console.log(`  ${k}: ${summary[k]}`);
  }

  await prisma.$disconnect();
}

process().catch((e) => {
  console.error('Fatal error', e);
  prisma.$disconnect().finally(() => process.exit(1));
});
