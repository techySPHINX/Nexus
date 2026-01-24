const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const GENDERS = ['male', 'female', 'non_binary', 'other', 'unspecified'];

async function seedProfileGenders() {
  try {
    console.log('🌱 Seeding profile genders...');

    const profiles = await prisma.profile.findMany({ select: { id: true, userId: true } });
    console.log(`Found ${profiles.length} profiles`);

    if (profiles.length === 0) {
      console.log('❌ No profiles found. Consider creating profiles first.');
      return;
    }

    for (const p of profiles) {  
      // Skip profiles that already have a gender
      const existing = await prisma.profile.findUnique({ where: { id: p.id }, select: { gender: true } });
      if (existing?.gender) {
        console.log(`⏭️ Skipping profile ${p.id} (already has gender)`);
        continue;
      }

      const random = GENDERS[Math.floor(Math.random() * GENDERS.length)];
      await prisma.profile.update({ where: { id: p.id }, data: { gender: random } });
      console.log(`✅ Set gender='${random}' for profile ${p.id}`);
    }

    console.log('🎉 Profile genders seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding profile genders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProfileGenders();
