const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TYPES = [
  'TECH',
  'GAME',
  'MUSIC',
  'SPORT',
  'ART',
  'SCIENCE',
  'EDUCATION',
  'ENTERTAINMENT',
  'LIFESTYLE',
  'OTHER',
];

async function main() {
  for (const name of TYPES) {
    try {
      await prisma.subCommunityType.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      console.log('Ensured type', name);
    } catch (err) {
      console.error('Failed to upsert type', name, err);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
