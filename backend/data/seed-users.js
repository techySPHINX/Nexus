const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function seedUsers() {
  try {
    console.log('🌱 Seeding database with test users...');

    const avatar = (seed) =>
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;

    const banner = (seed) =>
      `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/320`;

    // Create baseline users with realistic profiles
    const users = [
      {
        email: 'test1@kiit.ac.in',
        password: 'abcdef',
        name: 'Arjun Nanda',
        role: 'STUDENT',
        profile: {
          bio: 'Third-year CSE student building products around AI-assisted learning.',
          location: 'KIIT University, Bhubaneswar',
          interests: 'AI, Hackathons, Product Design',
          dept: 'CSE',
          year: '2026',
          branch: 'CSE',
          course: 'B.Tech',
          avatarUrl: avatar('Arjun Nanda'),
        },
      },
      {
        email: 'test2@kiit.ac.in',
        password: 'abcdef',
        name: 'Meera Patnaik',
        role: 'STUDENT',
        profile: {
          bio: 'Electronics student focused on IoT systems and edge AI prototypes.',
          location: 'KIIT University, Bhubaneswar',
          interests: 'IoT, Embedded Systems, Robotics',
          dept: 'ECE',
          year: '2025',
          branch: 'ECE',
          course: 'B.Tech',
          avatarUrl: avatar('Meera Patnaik'),
        },
      },
      {
        email: 'test3@kiit.ac.in',
        password: 'abcdef',
        name: 'Ritwik Das',
        role: 'ALUM',
        profile: {
          bio: 'KIIT alumnus working on backend systems and distributed architecture.',
          location: 'Bengaluru, India',
          interests: 'System Design, Mentoring, Open Source',
          dept: 'CSE',
          year: '2021',
          branch: 'CSE',
          course: 'B.Tech',
          avatarUrl: avatar('Ritwik Das'),
        },
      },
      {
        email: 'test4@kiit.ac.in',
        password: 'abcdef',
        name: 'Nexus Admin',
        role: 'ADMIN',
        profile: {
          bio: 'Platform admin coordinating student-alumni initiatives and moderation.',
          location: 'KIIT University, Bhubaneswar',
          interests: 'Community Building, Operations, Technology',
          dept: 'IT',
          year: '2020',
          branch: 'IT',
          course: 'B.Tech',
          avatarUrl: avatar('Nexus Admin'),
        },
      },
    ];

    for (const userData of users) {
      const hashedPassword = await hash(userData.password, 10);

      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          role: userData.role,
          iconUrl: userData.profile.avatarUrl,
          bannerUrl: banner(userData.email),
          isEmailVerified: true,
          isAccountActive: true,
          accountStatus: 'ACTIVE',
          profile: {
            upsert: {
              update: userData.profile,
              create: userData.profile,
            },
          },
        },
        create: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          isEmailVerified: true,
          isAccountActive: true,
          accountStatus: 'ACTIVE',
          iconUrl: userData.profile.avatarUrl,
          bannerUrl: banner(userData.email),
          profile: {
            create: userData.profile,
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
