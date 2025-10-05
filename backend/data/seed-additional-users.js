import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdditionalUsers() {
  try {
    console.log('🌱 Seeding database with additional test users...');

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
          course: 'B.Tech'
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
          course: 'B.Tech'
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
          course: 'B.Tech'
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
          course: 'B.Tech'
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
          course: 'B.Tech'
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
          course: 'B.Tech'
        }
      }
    ];

    for (const userData of additionalUsers) {
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
