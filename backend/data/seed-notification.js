import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function seedNotifications() {
  try {
    console.log('🌱 Seeding database with test notifications...');
    await prisma.notification.createMany({
      data: [
        {
          userId: '1882b9ee-429d-4244-b170-ed77b07c41b1',
          type: 'CONNECTION_REQUEST',
          message: 'User A sent you a connection request.',
        },
        {
          userId: '1882b9ee-429d-4244-b170-ed77b07c41b1',
          type: 'CONNECTION_ACCEPTED',
          message: 'User B accepted your connection request.',
        },
        {
          userId: '1882b9ee-429d-4244-b170-ed77b07c41b1',
          type: 'POST_VOTE',
          message: 'User C liked your post.',
        },
        {
          userId: '1882b9ee-429d-4244-b170-ed77b07c41b1',
          type: 'POST_COMMENT',
          message: 'User D commented on your post.',
        },
        {
          userId: '1882b9ee-429d-4244-b170-ed77b07c41b1',
          type: 'MESSAGE',
          message: 'User E sent you a message.',
        },
        {
          userId: '1882b9ee-429d-4244-b170-ed77b07c41b1',
          type: 'SYSTEM',
          message: 'System maintenance scheduled for tomorrow.',
        },
        {
          userId: '1882b9ee-429d-4244-b170-ed77b07c41b1',
          type: 'EVENT',
          message: 'You have been invited to an event.',
        },
        {
          userId: '1882b9ee-429d-4244-b170-ed77b07c41b1',
          type: 'REFERRAL_APPLICATION',
          message: 'User F applied for your referral.',
        },
        {
          userId: '1882b9ee-429d-4244-b170-ed77b07c41b1',
          type: 'REFERRAL_STATUS_UPDATE',
          message: 'Your referral status has been updated.',
        },
        {
          userId: '1882b9ee-429d-4244-b170-ed77b07c41b1',
          type: 'REFERRAL_APPLICATION_STATUS_UPDATE',
          message: 'Your referral application status has changed.',
        },
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
