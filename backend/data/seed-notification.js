const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
async function seedNotifications() {
  try {
    console.log('🌱 Seeding database with test notifications...');

    // Use an existing user for notifications
    let user = await prisma.user.findFirst({
      where: { email: 'test1@kiit.ac.in' },
      select: { id: true },
    });
    if (!user) {
      user = await prisma.user.findFirst({ select: { id: true } });
    }
    if (!user) {
      console.log('❌ No users found. Seed users first.');
      return;
    }

    const userId = user.id;

    await prisma.notification.createMany({
      data: [
        { userId, type: 'CONNECTION_REQUEST', message: 'User A sent you a connection request.' },
        { userId, type: 'CONNECTION_ACCEPTED', message: 'User B accepted your connection request.' },
        { userId, type: 'POST_VOTE', message: 'User C liked your post.' },
        { userId, type: 'POST_COMMENT', message: 'User D commented on your post.' },
        { userId, type: 'MESSAGE', message: 'User E sent you a message.' },
        { userId, type: 'SYSTEM', message: 'System maintenance scheduled for tomorrow.' },
        { userId, type: 'EVENT', message: 'You have been invited to an event.' },
        { userId, type: 'REFERRAL_APPLICATION', message: 'User F applied for your referral.' },
        { userId, type: 'REFERRAL_STATUS_UPDATE', message: 'Your referral status has been updated.' },
        { userId, type: 'REFERRAL_APPLICATION_STATUS_UPDATE', message: 'Your referral application status has changed.' },
      ],
    });
    console.log('✅ Seeding completed.');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotifications();
