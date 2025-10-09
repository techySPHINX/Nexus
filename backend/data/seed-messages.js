import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMessages() {
  try {
    console.log('🌱 Seeding messages...');

    // Get accepted connections
    const connections = await prisma.connection.findMany({
      where: { status: 'ACCEPTED' },
      include: {
        requester: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } }
      }
    });

    console.log(`Found ${connections.length} accepted connections`);

    if (connections.length === 0) {
      console.log('❌ No accepted connections found. Please seed connections first.');
      return;
    }

    // Create sample messages
    const messages = [
      {
        senderId: connections[0].requesterId,
        receiverId: connections[0].recipientId,
        content: "Hey! How are you doing? I saw your recent project on GitHub, it looks amazing!"
      },
      {
        senderId: connections[0].recipientId,
        receiverId: connections[0].requesterId,
        content: "Thank you! I've been working on it for a while. Are you interested in collaborating?"
      },
      {
        senderId: connections[0].requesterId,
        receiverId: connections[0].recipientId,
        content: "Absolutely! I'd love to contribute. What technologies are you using?"
      },
      {
        senderId: connections[1].requesterId,
        receiverId: connections[1].recipientId,
        content: "Hi! I noticed you're working in the same field. Would you like to connect and share experiences?"
      },
      {
        senderId: connections[1].recipientId,
        receiverId: connections[1].requesterId,
        content: "That sounds great! I'm always interested in networking with fellow professionals."
      },
      {
        senderId: connections[2]?.requesterId,
        receiverId: connections[2]?.recipientId,
        content: "Hello! I saw your profile and I'm impressed with your achievements. Would you be interested in mentoring?"
      },
      {
        senderId: connections[2]?.recipientId,
        receiverId: connections[2]?.requesterId,
        content: "I'd be happy to help! What specific areas are you looking to develop?"
      },
      {
        senderId: connections[3]?.requesterId,
        receiverId: connections[3]?.recipientId,
        content: "Hey there! Are you attending the upcoming tech conference?"
      },
      {
        senderId: connections[3]?.recipientId,
        receiverId: connections[3]?.requesterId,
        content: "Yes, I am! Are you going too? We should meet up!"
      },
      {
        senderId: connections[4]?.requesterId,
        receiverId: connections[4]?.recipientId,
        content: "Good morning! I hope you're having a productive day. Any exciting projects you're working on?"
      }
    ].filter(msg => msg.senderId && msg.receiverId); // Filter out undefined values

    for (const messageData of messages) {
      try {
        const message = await prisma.message.create({
          data: messageData,
          include: {
            sender: { select: { name: true } },
            receiver: { select: { name: true } }
          }
        });
        console.log(`✅ Created message: ${message.sender.name} → ${message.receiver.name}`);
      } catch (error) {
        console.log(`❌ Error creating message: ${error.message}`);
      }
    }

    console.log('🎉 Messages seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding messages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMessages();
