import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCommunities() {
  try {
    console.log('🌱 Seeding database with test communities...');

    // Create test communities
    const communities = [
      {
        name: 'Test Community 1',
        description: 'This is a test community',
        isPrivate: false,
        ownerId: 'test1@kiit.ac.in',
      },
      {
        name: 'Test Community 2',
        description: 'This is another test community',
        isPrivate: true,
        ownerId: 'test2@kiit.ac.in',
      },
      {
        name: 'Test Community 3',
        description: 'This is another test community',
        isPrivate: true,
        ownerId: 'test2@kiit.ac.in',
      },
      {
        name: 'Test Community 4',
        description: 'This is another test community',
        isPrivate: true,
        ownerId: 'test2@kiit.ac.in',
      },
      {
        name: 'Test Community 5',
        description: 'This is another test community',
        isPrivate: true,
        ownerId: 'test2@kiit.ac.in',
      },
    ];

    for (const communityData of communities) {
      const community = await prisma.subCommunity.upsert({
        where: { name: communityData.name },
        update: {},
        create: {
          name: communityData.name,
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

      // Update the type for the existing subCommunityType if it exists, otherwise create it
      const existingType = await prisma.subCommunityType.findFirst({
        where: { type: communityData.type },
      });

      if (existingType) {
        await prisma.subCommunityType.update({
          where: { id: existingType.id },
          data: {
            SubCommunity: {
              connect: { id: community.id },
            },
          },
        });
      } else {
        await prisma.subCommunityType.create({
          data: {
            type: communityData.type,
            SubCommunity: {
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
