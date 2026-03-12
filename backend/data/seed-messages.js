const { PrismaClient } = require('@prisma/client');

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

    const messageTemplates = [
      [
        'Hey! I saw your latest project update. The architecture breakdown was super clear.',
        'Thanks! I am refining the API layer next. Happy to share the planning doc if useful.',
        'That would be great. I can also help with test coverage this weekend.',
      ],
      [
        'Are you joining the alumni AMA session on Friday?',
        'Yes, I am. I am preparing a few questions on backend interview prep.',
        'Perfect, I will join too. Let us sync before the session.',
      ],
      [
        'Your post on internship prep was very helpful. Do you have a mock interview checklist?',
        'I do. I can send a concise checklist and a system design template.',
        'Amazing, thanks a lot. That will help our group as well.',
      ],
      [
        'Would you be open to reviewing my project README once?',
        'Sure. Share the repo link and I will leave comments tonight.',
        'Sent. Really appreciate the quick help.',
      ],
    ];

    const messages = [];
    for (let i = 0; i < connections.length; i++) {
      const c = connections[i];
      const thread = messageTemplates[i % messageTemplates.length];

      thread.forEach((content, idx) => {
        const senderId = idx % 2 === 0 ? c.requesterId : c.recipientId;
        const receiverId = idx % 2 === 0 ? c.recipientId : c.requesterId;
        messages.push({ senderId, receiverId, content });
      });
    }

    for (const messageData of messages) {
      try {
        const exists = await prisma.message.findFirst({
          where: {
            senderId: messageData.senderId,
            receiverId: messageData.receiverId,
            content: messageData.content,
          },
        });

        if (exists) {
          console.log('⏭️ Skipping duplicate message');
          continue;
        }

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
