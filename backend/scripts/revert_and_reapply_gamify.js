#!/usr/bin/env node
/**
 * revert_and_reapply_gamify.js
 *
 * Usage:
 *  node backend/scripts/revert_and_reapply_gamify.js --delete-after="2025-11-26T00:00:00Z" [--rerun]
 *
 * Description:
 *  - Deletes pointTransaction rows of gamified events (project/startup/referral/comments)
 *    created at or after the provided --delete-after ISO timestamp.
 *  - Recomputes `userPoints` from the remaining `pointTransaction` rows so totals are consistent.
 *  - If `--rerun` is provided, it will execute `backend/scripts/gamify_existing.js` after cleanup.
 *
 * IMPORTANT: Make a database backup before running this script.
 */

const { PrismaClient } = require('@prisma/client');
const { spawnSync } = require('child_process');

const prisma = new PrismaClient();

const EVENT_TYPES = [
  'PROJECT_CREATED',
  'STARTUP_CREATED',
  'REFERRAL_POSTED',
  'COMMENT_CREATED',
  'COMMENT_REPLY',
  'PROJECT_COMMENT',
  'STARTUP_COMMENT',
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { deleteAfter: null, rerun: false };
  for (const a of args) {
    if (a.startsWith('--delete-after=')) out.deleteAfter = a.split('=')[1];
    if (a === '--rerun') out.rerun = true;
  }
  return out;
}

async function recomputeUserPoints() {
  console.log('Recomputing userPoints from remaining pointTransaction rows...');

  // Aggregate sums by userId
  const groups = await prisma.pointTransaction.groupBy({
    by: ['userId'],
    _sum: { points: true },
  });

  // Upsert userPoints to match aggregated sums
  for (const g of groups) {
    const points = g._sum.points ?? 0;
    await prisma.userPoints.upsert({
      where: { userId: g.userId },
      update: { points },
      create: { userId: g.userId, points },
    });
  }

  // For any userPoints that have no transactions, set points to 0
  const existingUserPointUsers = (await prisma.userPoints.findMany({ select: { userId: true } })).map(u => u.userId);
  const usersWithTx = groups.map(g => g.userId);
  const usersToZero = existingUserPointUsers.filter(u => !usersWithTx.includes(u));
  if (usersToZero.length) {
    console.log(`Setting points to 0 for ${usersToZero.length} users with no transactions`);
    await prisma.userPoints.updateMany({ where: { userId: { in: usersToZero } }, data: { points: 0 } });
  }

  console.log('Recompute complete.');
}

async function main() {
  const { deleteAfter, rerun } = parseArgs();

  if (!deleteAfter) {
    console.error('Missing --delete-after argument (ISO timestamp). Example: --delete-after="2025-11-26T00:00:00Z"');
    process.exit(1);
  }

  const deleteAfterDate = new Date(deleteAfter);
  if (Number.isNaN(deleteAfterDate.getTime())) {
    console.error('Invalid date provided to --delete-after');
    process.exit(1);
  }

  console.log(`Deleting pointTransaction rows of types ${EVENT_TYPES.join(', ')} created at or after ${deleteAfterDate.toISOString()}`);

  // Find transactions to delete
  const toDelete = await prisma.pointTransaction.findMany({
    where: {
      type: { in: EVENT_TYPES },
      createdAt: { gte: deleteAfterDate },
    },
    select: { id: true },
  });

  console.log(`Found ${toDelete.length} transactions to delete.`);

  if (toDelete.length === 0) {
    console.log('Nothing to delete. Exiting.');
    if (rerun) {
      console.log('Rerun requested; executing backfill script.');
      spawnSync('node', ['backend/scripts/gamify_existing.js'], { stdio: 'inherit' });
    }
    await prisma.$disconnect();
    return;
  }

  const ids = toDelete.map(t => t.id);

  // Delete in batches
  const batchSize = 500;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    console.log(`Deleting batch ${i / batchSize + 1} (${batch.length} rows)`);
    await prisma.pointTransaction.deleteMany({ where: { id: { in: batch } } });
  }

  // Recompute userPoints totals from remaining transactions
  await recomputeUserPoints();

  if (rerun) {
    console.log('Rerun requested; executing backfill script.');
    const res = spawnSync('node', ['backend/scripts/gamify_existing.js'], { stdio: 'inherit' });
    if (res.error) {
      console.error('Failed to rerun backfill script:', res.error);
    }
  }

  await prisma.$disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error('Fatal error', e);
  prisma.$disconnect().finally(() => process.exit(1));
});
