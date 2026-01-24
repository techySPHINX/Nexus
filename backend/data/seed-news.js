const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedNews() {
  try {
    console.log('🌱 Seeding news items...');

    const items = [
      {
        title: 'Nexus Launches New Mentorship Program',
        slug: 'nexus-launches-mentorship',
        summary: 'A new mentorship program connecting students and alumni',
        content:
          'We are excited to announce the Nexus Mentorship Program that pairs experienced alumni with current students for career guidance and project collaboration.',
        imageUrl: null,
        published: true,
      },
      {
        title: 'Campus Hackathon Winners Announced',
        slug: 'campus-hackathon-winners',
        summary: 'The results of the annual campus hackathon are out',
        content:
          'Congratulations to the winning teams of the annual campus hackathon. Check out their projects and solutions on the platform.',
        imageUrl: null,
        published: true,
      },
      {
        title: 'Alumni Spotlight: Career Paths After Nexus',
        slug: 'alumni-spotlight-career-paths',
        summary: 'Stories from our alumni on their career journeys',
        content:
          'Read inspiring stories from alumni who leveraged Nexus networking to land roles at top companies and launch startups.',
        imageUrl: null,
        published: true,
      },
    ];

    for (const n of items) {
      const now = new Date();
      const existing = await prisma.news.findUnique({ where: { slug: n.slug } });
      if (existing) {
        await prisma.news.update({ where: { id: existing.id }, data: { ...n, publishedAt: now } });
        console.log(`Updated news: ${n.slug}`);
      } else {
        await prisma.news.create({ data: { ...n, publishedAt: now } });
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
