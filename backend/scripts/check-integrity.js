#!/usr/bin/env node

/**
 * Script to run database integrity checks
 * Usage: npm run check:integrity
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkForeignKeyIntegrity() {
  console.log('🔍 Checking foreign key integrity...\n');

  const errors = [];

  try {
    // Check orphaned messages
    const orphanedMessages = await prisma.$queryRaw`
      SELECT m.id, m."senderId", m."receiverId"
      FROM message m
      LEFT JOIN users s ON m."senderId" = s.id
      LEFT JOIN users r ON m."receiverId" = r.id
      WHERE s.id IS NULL OR r.id IS NULL
      LIMIT 10
    `;

    if (orphanedMessages.length > 0) {
      errors.push(`❌ Found ${orphanedMessages.length} orphaned messages`);
    } else {
      console.log('✅ No orphaned messages found');
    }

    // Check orphaned connections
    const orphanedConnections = await prisma.$queryRaw`
      SELECT c.id, c."requesterId", c."recipientId"
      FROM connection c
      LEFT JOIN users req ON c."requesterId" = req.id
      LEFT JOIN users rec ON c."recipientId" = rec.id
      WHERE req.id IS NULL OR rec.id IS NULL
      LIMIT 10
    `;

    if (orphanedConnections.length > 0) {
      errors.push(
        `❌ Found ${orphanedConnections.length} orphaned connections`,
      );
    } else {
      console.log('✅ No orphaned connections found');
    }

    // Check orphaned referral applications
    const orphanedApplications = await prisma.$queryRaw`
      SELECT ra.id, ra."referralId", ra."applicantId"
      FROM referral_applications ra
      LEFT JOIN referrals r ON ra."referralId" = r.id
      LEFT JOIN users u ON ra."applicantId" = u.id
      WHERE r.id IS NULL OR u.id IS NULL
      LIMIT 10
    `;

    if (orphanedApplications.length > 0) {
      errors.push(
        `❌ Found ${orphanedApplications.length} orphaned referral applications`,
      );
    } else {
      console.log('✅ No orphaned referral applications found');
    }
  } catch (error) {
    errors.push(`❌ Foreign key check failed: ${error.message}`);
  }

  return errors;
}

async function checkDataConsistency() {
  console.log('\n🔍 Checking data consistency...\n');

  const errors = [];

  try {
    // Check for duplicate connections
    const duplicateConnections = await prisma.$queryRaw`
      SELECT "requesterId", "recipientId", COUNT(*) as count
      FROM connection
      GROUP BY "requesterId", "recipientId"
      HAVING COUNT(*) > 1
    `;

    if (duplicateConnections.length > 0) {
      errors.push(
        `❌ Found ${duplicateConnections.length} duplicate connections`,
      );
    } else {
      console.log('✅ No duplicate connections found');
    }

    // Check for duplicate referral applications
    const duplicateApplications = await prisma.$queryRaw`
      SELECT "referralId", "applicantId", COUNT(*) as count
      FROM referral_applications
      GROUP BY "referralId", "applicantId"
      HAVING COUNT(*) > 1
    `;

    if (duplicateApplications.length > 0) {
      errors.push(
        `❌ Found ${duplicateApplications.length} duplicate referral applications`,
      );
    } else {
      console.log('✅ No duplicate referral applications found');
    }

    // Check for messages between non-connected users
    const invalidMessages = await prisma.$queryRaw`
      SELECT m.id, m."senderId", m."receiverId"
      FROM message m
      WHERE NOT EXISTS (
        SELECT 1 FROM connection c
        WHERE c.status = 'ACCEPTED'
        AND (
          (c."requesterId" = m."senderId" AND c."recipientId" = m."receiverId")
          OR (c."requesterId" = m."receiverId" AND c."recipientId" = m."senderId")
        )
      )
      LIMIT 10
    `;

    if (invalidMessages.length > 0) {
      console.warn(
        `⚠️  Found ${invalidMessages.length} messages between non-connected users (may be legacy data)`,
      );
    } else {
      console.log('✅ All messages are between connected users');
    }
  } catch (error) {
    errors.push(`❌ Data consistency check failed: ${error.message}`);
  }

  return errors;
}

async function getDatabaseStats() {
  console.log('\n📊 Database Statistics:\n');

  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size,
        n_live_tup AS row_count
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size('public.'||tablename) DESC
      LIMIT 10
    `;

    console.table(stats);
  } catch (error) {
    console.error(`❌ Failed to get database stats: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting Database Integrity Check\n');
  console.log('═'.repeat(50));

  const allErrors = [];

  // Run checks
  const fkErrors = await checkForeignKeyIntegrity();
  const consistencyErrors = await checkDataConsistency();

  allErrors.push(...fkErrors, ...consistencyErrors);

  // Display stats
  await getDatabaseStats();

  console.log('\n═'.repeat(50));

  // Summary
  if (allErrors.length === 0) {
    console.log('\n✅ All integrity checks passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Integrity check failed with errors:\n');
    allErrors.forEach((error) => console.log(error));
    console.log('\n⚠️  Please review and fix the issues above.');
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('💥 Integrity check failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
