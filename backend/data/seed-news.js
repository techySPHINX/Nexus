const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedNews() {
  try {
    console.log('🌱 Seeding news items...');

    const adminOrAlum = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'ALUM'] } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    const items = [
      {
        title: 'Nexus Launches New Mentorship Program',
        slug: 'nexus-launches-mentorship',
        summary: 'A new mentorship program connecting students and alumni',
        content:
          'We are excited to announce the Nexus Mentorship Program that pairs experienced alumni with current students for career guidance and project collaboration.',
        imageUrl:
          'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200',
        published: true,
        topic: 'Mentorship',
      },
      {
        title: 'Campus Hackathon Winners Announced',
        slug: 'campus-hackathon-winners',
        summary: 'The results of the annual campus hackathon are out',
        content:
          'Congratulations to the winning teams of the annual campus hackathon. Check out their projects and solutions on the platform.',
        imageUrl:
          'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
        published: true,
        topic: 'Hackathon',
      },
      {
        title: 'Alumni Spotlight: Career Paths After Nexus',
        slug: 'alumni-spotlight-career-paths',
        summary: 'Stories from our alumni on their career journeys',
        content:
          'Read inspiring stories from alumni who leveraged Nexus networking to land roles at top companies and launch startups.',
        imageUrl:
          'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200',
        published: true,
        topic: 'Alumni',
      },
    ];

    for (let i = 0; i < items.length; i++) {
      const n = items[i];
      const publishedAt = new Date(Date.now() - i * 24 * 60 * 60 * 1000);

      const existing = await prisma.news.findUnique({ where: { slug: n.slug } });
      if (existing) {
        await prisma.news.update({
          where: { id: existing.id },
          data: {
            ...n,
            authorId: adminOrAlum?.id,
            publishedAt,
          },
        });
        console.log(`Updated news: ${n.slug}`);
      } else {
        await prisma.news.create({
          data: {
            ...n,
            authorId: adminOrAlum?.id,
            publishedAt,
          },
        });
        console.log(`Created news: ${n.slug}`);
      }
    }

    console.log('🎉 News seeding completed!');
  } catch (err) {
    console.error('❌ Error seeding news:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedNews();
