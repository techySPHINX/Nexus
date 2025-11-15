const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedConnections() {
  try {
    console.log('🌱 Seeding connections...');

    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);

    if (users.length < 2) {
      console.log('❌ Need at least 2 users to create connections');
      return;
    }

    // Create connections between users
    const connections = [
      {
        requesterId: users[0].id,
        recipientId: users[1].id,
        status: 'ACCEPTED'
      },
      {
        requesterId: users[1].id,
        recipientId: users[2].id,
        status: 'ACCEPTED'
      },
      {
        requesterId: users[0].id,
        recipientId: users[2].id,
        status: 'PENDING'
      },
      {
        requesterId: users[3].id,
        recipientId: users[4].id,
        status: 'ACCEPTED'
      },
      {
        requesterId: users[4].id,
        recipientId: users[5].id,
        status: 'ACCEPTED'
      },
      {
        requesterId: users[2].id,
        recipientId: users[6].id,
        status: 'PENDING'
      },
      {
        requesterId: users[7].id,
        recipientId: users[8].id,
        status: 'ACCEPTED'
      },
      {
        requesterId: users[8].id,
        recipientId: users[9].id,
        status: 'ACCEPTED'
      }
    ];

    for (const connectionData of connections) {
      try {
        const connection = await prisma.connection.create({
          data: connectionData,
          include: {
            requester: { select: { name: true, email: true } },
            recipient: { select: { name: true, email: true } }
          }
        });
        console.log(`✅ Created connection: ${connection.requester.name} → ${connection.recipient.name} (${connection.status})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Connection already exists: ${connectionData.requesterId} → ${connectionData.recipientId}`);
        } else {
          console.log(`❌ Error creating connection: ${error.message}`);
        }
      }
    }

    console.log('🎉 Connections seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding connections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedConnections();
