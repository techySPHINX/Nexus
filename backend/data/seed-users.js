import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('🌱 Seeding database with test users...');

    // Create test users
    const users = [
      {
        email: 'test1@kiit.ac.in',
        password: 'abcdef',
        name: 'Test User 1',
        role: 'STUDENT',
      },
      {
        email: 'test2@kiit.ac.in',
        password: 'abcdef',
        name: 'Test User 2',
        role: 'STUDENT',
      },
      {
        email: 'test3@kiit.ac.in',
        password: 'abcdef',
        name: 'Test User 3',
        role: 'ALUM',
      },
      {
        email: 'test4@kiit.ac.in',
        password: 'abcdef',
        name: 'Test User 4',
        role: 'ADMIN',
      },
    ];

    for (const userData of users) {
      const hashedPassword = await hash(userData.password, 10);

      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          profile: {
            create: {
              bio: `This is ${userData.name}'s profile`,
              location: 'KIIT University',
              interests: 'Technology, Networking, Learning',
            },
          },
        },
      });

      console.log(`✅ Created user: ${user.email} (ID: ${user.id})`);
    }

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
