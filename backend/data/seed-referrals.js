import { PrismaClient, ReferralStatus } from '@prisma/client';

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

    // Find alumni and admin users
    const alumni = users.find((user) => user.role === 'ALUM');
    const admin = users.find((user) => user.role === 'ADMIN');
    const creator = alumni || admin || users.find((user) => user.role === 'ALUM' || user.role === 'ADMIN') || users[0];

    if (!creator) {
      console.log('❌ No alumni or admin users found. Creating one...');
      const { hash } = await import('bcrypt');
      const hashedPassword = await hash('password123', 10);
      const newAlumni = await prisma.user.create({
        data: {
          email: 'alumni@test.com',
          password: hashedPassword,
          name: 'Test Alumni',
          role: 'ALUM',
          isEmailVerified: true,
          isAccountActive: true,
          accountStatus: 'ACTIVE',
        },
      });
      console.log('✅ Created alumni user:', newAlumni.email);
      creator.id = newAlumni.id;
    }

    // Create sample referrals with different statuses
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
        alumniId: creator.id,
        status: ReferralStatus.APPROVED, // Approved - visible to everyone
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
        alumniId: creator.id,
        status: ReferralStatus.APPROVED, // Approved - visible to everyone
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
        alumniId: creator.id,
        status: ReferralStatus.PENDING, // Pending - only visible to admin and creator
      },
      {
        company: 'CloudTech Systems',
        jobTitle: 'DevOps Engineer',
        description:
          'Looking for an experienced DevOps engineer to manage our cloud infrastructure and CI/CD pipelines.',
        requirements:
          '5+ years experience, AWS, Docker, Kubernetes, Terraform, CI/CD',
        location: 'Seattle, WA',
        deadline: new Date('2025-12-15T23:59:59.000Z'),
        referralLink: 'https://cloudtech.com/careers/devops',
        alumniId: creator.id,
        status: ReferralStatus.APPROVED, // Approved - visible to everyone
      },
      {
        company: 'AI Innovations',
        jobTitle: 'Machine Learning Engineer',
        description:
          'Join our AI team to build cutting-edge machine learning models and deploy them at scale.',
        requirements:
          'PhD or Masters in ML, Python, PyTorch, TensorFlow, MLOps',
        location: 'Boston, MA',
        deadline: new Date('2026-02-28T23:59:59.000Z'),
        alumniId: creator.id,
        status: ReferralStatus.PENDING, // Pending - only visible to admin and creator
      },
      {
        company: 'FinTech Global',
        jobTitle: 'Full Stack Developer',
        description:
          'Build scalable financial applications using modern web technologies.',
        requirements:
          '4+ years experience, React, Node.js, PostgreSQL, TypeScript',
        location: 'London, UK',
        deadline: new Date('2025-12-20T23:59:59.000Z'),
        referralLink: 'https://fintech.com/careers/fullstack',
        alumniId: creator.id,
        status: ReferralStatus.APPROVED, // Approved - visible to everyone
      },
    ];

    for (const referralData of sampleReferrals) {
      try {
        const referral = await prisma.referral.create({
          data: referralData,
          include: {
            postedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });
        console.log(
          `✅ Created referral: ${referral.jobTitle} at ${referral.company} (Status: ${referral.status})`,
        );
      } catch (error) {
        console.error(`❌ Error creating referral ${referralData.jobTitle}:`, error.message);
      }
    }

    console.log('🎉 Referrals seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding referrals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedReferrals();
