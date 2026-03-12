const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdditionalUsers() {
  try {
    console.log('🌱 Seeding database with additional test users...');

    const avatar = (seed) =>
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;

    const banner = (seed) =>
      `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/320`;

    // Create additional test users with more realistic data
    const additionalUsers = [
      {
        email: 'admin@kiit.ac.in',
        password: 'admin123',
        name: 'Admin User',
        role: 'ADMIN',
        profile: {
          bio: 'System Administrator for Nexus Platform',
          location: 'KIIT University, Bhubaneswar',
          interests: 'Technology, Management, Student Affairs',
          dept: 'IT',
          year: '2020',
          branch: 'CSE',
          course: 'B.Tech',
          avatarUrl: avatar('Admin User'),
        }
      },
      {
        email: 'john.doe@kiit.ac.in',
        password: 'student123',
        name: 'John Doe',
        role: 'STUDENT',
        profile: {
          bio: 'Final year Computer Science student passionate about AI and Machine Learning',
          location: 'KIIT University, Bhubaneswar',
          interests: 'Artificial Intelligence, Machine Learning, Web Development',
          dept: 'CSE',
          year: '2024',
          branch: 'CSE',
          course: 'B.Tech',
          avatarUrl: avatar('John Doe'),
        }
      },
      {
        email: 'jane.smith@kiit.ac.in',
        password: 'student123',
        name: 'Jane Smith',
        role: 'STUDENT',
        profile: {
          bio: 'Third year Electronics student interested in IoT and Embedded Systems',
          location: 'KIIT University, Bhubaneswar',
          interests: 'IoT, Embedded Systems, Robotics',
          dept: 'ECE',
          year: '2025',
          branch: 'ECE',
          course: 'B.Tech',
          avatarUrl: avatar('Jane Smith'),
        }
      },
      {
        email: 'alex.johnson@kiit.ac.in',
        password: 'alumni123',
        name: 'Alex Johnson',
        role: 'ALUM',
        profile: {
          bio: 'KIIT Alumni 2020, currently working as Software Engineer at Google',
          location: 'Bangalore, India',
          interests: 'Software Engineering, Mentoring, Career Development',
          dept: 'CSE',
          year: '2020',
          branch: 'CSE',
          course: 'B.Tech',
          avatarUrl: avatar('Alex Johnson'),
        }
      },
      {
        email: 'sarah.wilson@kiit.ac.in',
        password: 'alumni123',
        name: 'Sarah Wilson',
        role: 'ALUM',
        profile: {
          bio: 'KIIT Alumni 2019, Product Manager at Microsoft',
          location: 'Seattle, USA',
          interests: 'Product Management, Leadership, Innovation',
          dept: 'CSE',
          year: '2019',
          branch: 'CSE',
          course: 'B.Tech',
          avatarUrl: avatar('Sarah Wilson'),
        }
      },
      {
        email: 'mentor@kiit.ac.in',
        password: 'mentor123',
        name: 'Dr. Mentor Singh',
        role: 'MENTOR',
        profile: {
          bio: 'Senior Software Engineer with 10+ years experience, passionate about mentoring students',
          location: 'Pune, India',
          interests: 'Software Architecture, Mentoring, Open Source',
          dept: 'CSE',
          year: '2010',
          branch: 'CSE',
          course: 'B.Tech',
          avatarUrl: avatar('Dr. Mentor Singh'),
        }
      }
    ];

    for (const userData of additionalUsers) {
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
        include: {
          profile: true
        }
      });

      console.log(`✅ Created user: ${user.email} (${user.role}) - ID: ${user.id}`);
    }

    console.log('🎉 Additional users seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding additional users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdditionalUsers();
