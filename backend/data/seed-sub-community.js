const { PrismaClient } = require('@prisma/client');
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

    // Pre-create or fetch types to avoid repeated lookups
    const typeCache = {};

    for (const communityData of communities) {
      // Ensure the owner exists; if not, skip this community with a warning
      const owner = await prisma.user.findUnique({
        where: { email: communityData.ownerId },
      });
      if (!owner) {
        console.warn(
          `⚠️ Skipping community ${communityData.name} - owner not found: ${communityData.ownerId}`,
        );
        continue;
      }

      // Ensure the type exists (upsert) and cache it
      const typeName = (communityData.type || 'OTHER').toUpperCase();
      let typeRecord = typeCache[typeName];
      if (!typeRecord) {
        typeRecord = await prisma.subCommunityType.upsert({
          where: { name: typeName },
          update: {},
          create: { name: typeName },
        });
        typeCache[typeName] = typeRecord;
      }

      const community = await prisma.subCommunity.upsert({
        where: { name: communityData.name },
        update: {
          // keep description and privacy up-to-date if changed in seed
          description: communityData.description,
          isPrivate: communityData.isPrivate,
          ownerId: owner.id,
          typeId: typeRecord.id,
        },
        create: {
          name: communityData.name,
          description: communityData.description,
          isPrivate: communityData.isPrivate,
          owner: {
            connect: { email: communityData.ownerId },
          },
          // connect to the type by id
          type: { connect: { id: typeRecord.id } },
        },
      });

      // Ensure membership exists (owner as OWNER)
      await prisma.subCommunityMember.upsert({
        where: {
          // unique constraint is [userId, subCommunityId]; use composite unique requires raw where not supported in upsert
          // fallback: try to find existing membership then create if missing
          id: `owner-${owner.id}-${community.id}`,
        },
        update: {},
        create: {
          user: { connect: { email: communityData.ownerId } },
          subCommunity: { connect: { id: community.id } },
          role: 'OWNER',
        },
      }).catch(async (e) => {
        // If upsert by synthetic id fails (because id composite not available), fallback to create-if-not-exists
        const existing = await prisma.subCommunityMember.findFirst({
          where: { userId: owner.id, subCommunityId: community.id },
        });
        if (!existing) {
          await prisma.subCommunityMember.create({
            data: {
              user: { connect: { email: communityData.ownerId } },
              subCommunity: { connect: { id: community.id } },
              role: 'OWNER',
            },
          });
        }
      });

      console.log(`✅ Created/updated community: ${community.name} (ID: ${community.id})`);
    }

    console.log('🎉 Database seeding completed!');
    // Ensure every existing type has at least one community
    const allTypes = await prisma.subCommunityType.findMany();
    for (const t of allTypes) {
      const count = await prisma.subCommunity.count({ where: { typeId: t.id } });
      if (count === 0) {
        // pick an owner: prefer ADMIN, then any user
        let owner = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (!owner) owner = await prisma.user.findFirst();
        if (!owner) {
          console.warn(`⚠️ No users found to own a community for type ${t.name}. Skipping.`);
          continue;
        }

        const defaultName = `${t.name.charAt(0).toUpperCase() + t.name.slice(1).toLowerCase()} Community`;
        const community = await prisma.subCommunity.upsert({
          where: { name: defaultName },
          update: {
            description: `Default community for type ${t.name}`,
            isPrivate: false,
            ownerId: owner.id,
            typeId: t.id,
          },
          create: {
            name: defaultName,
            description: `Default community for type ${t.name}`,
            isPrivate: false,
            owner: { connect: { id: owner.id } },
            type: { connect: { id: t.id } },
          },
        });

        // Ensure membership exists (owner as OWNER)
        const existing = await prisma.subCommunityMember.findFirst({
          where: { userId: owner.id, subCommunityId: community.id },
        });
        if (!existing) {
          await prisma.subCommunityMember.create({
            data: {
              user: { connect: { id: owner.id } },
              subCommunity: { connect: { id: community.id } },
              role: 'OWNER',
            },
          });
        }

        console.log(`➕ Created default community for type ${t.name}: ${community.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCommunities();
