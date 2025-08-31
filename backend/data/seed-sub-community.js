import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCommunities() {
  try {
    console.log('🌱 Seeding database with test communities...');

    // Create test communities
    const communities = [
      {
        name: 'Art Enthusiasts',
        description: 'A place for art lovers to share and discuss.',
        isPrivate: false,
        ownerId: 'test1@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Tech Innovators',
        description: 'Discuss the latest in technology and innovation.',
        isPrivate: true,
        ownerId: 'test2@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Music Makers',
        description: 'For musicians and music lovers.',
        isPrivate: false,
        ownerId: 'test3@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Startup Founders',
        description: 'Connect with fellow entrepreneurs.',
        isPrivate: true,
        ownerId: 'test4@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Photography Club',
        description: 'Share your best shots and tips.',
        isPrivate: false,
        ownerId: 'test1@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Bookworms',
        description: 'A community for book lovers and readers.',
        isPrivate: false,
        ownerId: 'test1@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'AI Pioneers',
        description: 'Discuss artificial intelligence trends and projects.',
        isPrivate: true,
        ownerId: 'test2@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Film Buffs',
        description: 'For those who love movies and filmmaking.',
        isPrivate: false,
        ownerId: 'test3@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Robotics Club',
        description: 'Building and programming robots together.',
        isPrivate: true,
        ownerId: 'test4@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Design Thinkers',
        description: 'A space for creative design discussions.',
        isPrivate: false,
        ownerId: 'test1@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Gaming Guild',
        description: 'For gamers to connect and compete.',
        isPrivate: false,
        ownerId: 'test1@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Writers Den',
        description: 'Share your stories, poems, and writing tips.',
        isPrivate: false,
        ownerId: 'test2@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Web Devs',
        description: 'Frontend, backend, and fullstack discussions.',
        isPrivate: true,
        ownerId: 'test3@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Dance Crew',
        description: 'For dancers and dance enthusiasts.',
        isPrivate: false,
        ownerId: 'test4@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Cloud Computing',
        description: 'Explore cloud platforms and architectures.',
        isPrivate: true,
        ownerId: 'test1@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Chess Masters',
        description: 'Challenge and learn chess strategies.',
        isPrivate: false,
        ownerId: 'test1@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Mobile App Devs',
        description: 'Discuss mobile app development trends.',
        isPrivate: true,
        ownerId: 'test2@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Theatre Group',
        description: 'For actors and theatre lovers.',
        isPrivate: false,
        ownerId: 'test3@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Cybersecurity Hub',
        description: 'Stay updated on security news and tips.',
        isPrivate: true,
        ownerId: 'test4@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Painters Palette',
        description: 'Share your paintings and techniques.',
        isPrivate: false,
        ownerId: 'test1@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Data Science Lab',
        description: 'Discuss data analysis and machine learning.',
        isPrivate: true,
        ownerId: 'test1@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Poetry Corner',
        description: 'A place for poets to share and critique.',
        isPrivate: false,
        ownerId: 'test2@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Electronics Geeks',
        description: 'DIY electronics and hardware hacking.',
        isPrivate: true,
        ownerId: 'test3@kiit.ac.in',
        type: 'TECH',
      },
      {
        name: 'Calligraphy Club',
        description: 'For beautiful writing and lettering.',
        isPrivate: false,
        ownerId: 'test4@kiit.ac.in',
        type: 'ART',
      },
      {
        name: 'Blockchain Builders',
        description: 'Explore blockchain and crypto projects.',
        isPrivate: true,
        ownerId: 'test1@kiit.ac.in',
        type: 'TECH',
      },
    ];

    for (const communityData of communities) {
      const community = await prisma.subCommunity.upsert({
        where: { name: communityData.name },
        update: {},
        create: {
          name: communityData.name,
          type: communityData.type,
          description: communityData.description,
          isPrivate: communityData.isPrivate,
          owner: {
            connect: { email: communityData.ownerId },
          },
        },
      });

      // Avoid duplicate subCommunityMember entries
      const existingMember = await prisma.subCommunityMember.findFirst({
        where: {
          user: { email: communityData.ownerId },
          subCommunity: { id: community.id },
        },
      });

      if (!existingMember) {
        await prisma.subCommunityMember.create({
          data: {
            user: {
              connect: { email: communityData.ownerId },
            },
            subCommunity: {
              connect: { id: community.id },
            },
          },
        });
      }

      console.log(
        `✅ Created community: ${community.name} (ID: ${community.id})`,
      );
    }

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCommunities();
