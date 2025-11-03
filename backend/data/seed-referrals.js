import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedReferrals() {
  try {
    console.log('🌱 Seeding referrals...');

    // Get existing users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to create referrals');
      return;
    }

    // Find an alumni user
    const alumni = users.find((user) => user.role === 'ALUM');
    if (!alumni) {
      console.log('❌ No alumni users found. Creating one...');
      const newAlumni = await prisma.user.create({
        data: {
          email: 'alumni@test.com',
          password: 'hashedpassword', // In real app, this would be hashed
          name: 'Test Alumni',
          role: 'ALUM',
        },
      });
      console.log('✅ Created alumni user:', newAlumni.email);
    }

    // Create sample referrals
    const sampleReferrals = [
      {
        company: 'TechCorp Inc.',
        jobTitle: 'Software Engineer',
        description:
          'We are looking for a talented software engineer to join our team. The ideal candidate should have experience with React, Node.js, and TypeScript.',
        requirements:
          '3+ years of experience, React, Node.js, TypeScript, Git, Agile methodologies',
        location: 'San Francisco, CA',
        deadline: new Date('2025-12-31T23:59:59.000Z'),
        referralLink: 'https://techcorp.com/careers/software-engineer',
        alumniId: alumni?.id || users[0].id,
      },
      {
        company: 'DataFlow Solutions',
        jobTitle: 'Data Scientist',
        description:
          'Join our data science team to work on cutting-edge machine learning projects. You will be responsible for developing predictive models and analyzing large datasets.',
        requirements:
          'Masters in Data Science, Python, TensorFlow, SQL, Statistical Analysis',
        location: 'New York, NY',
        deadline: new Date('2025-11-30T23:59:59.000Z'),
        referralLink: 'https://dataflow.com/jobs/data-scientist',
        alumniId: alumni?.id || users[0].id,
      },
      {
        company: 'StartupXYZ',
        jobTitle: 'Product Manager',
        description:
          'We are seeking a product manager to lead our product development efforts. You will work closely with engineering and design teams to deliver exceptional user experiences.',
        requirements:
          '2+ years PM experience, User Research, Agile, Analytics tools',
        location: 'Remote',
        deadline: new Date('2026-01-15T23:59:59.000Z'),
        alumniId: alumni?.id || users[0].id,
      },
    ];

    for (const referralData of sampleReferrals) {
      const referral = await prisma.referral.create({
        data: referralData,
      });
      console.log(
        `✅ Created referral: ${referral.jobTitle} at ${referral.company}`,
      );
    }

    console.log('🎉 Referrals seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding referrals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedReferrals();
