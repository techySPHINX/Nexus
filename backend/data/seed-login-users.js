import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUser(email, name, role) {
  const password = 'abcdef';
  const passwordHash = await hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      isEmailVerified: true,
      isAccountActive: true,
      accountStatus: 'ACTIVE',
      role,
    },
    create: {
      email,
      password: passwordHash,
      name,
      role,
      isEmailVerified: true,
      isAccountActive: true,
      accountStatus: 'ACTIVE',
      profile: {
        create: {
          bio: `${name} profile`,
          location: 'Local Dev',
          interests: 'Testing, Development',
        },
      },
    },
  });
  console.log(`✅ Upserted ${role}: ${email} (id: ${user.id})`);
}

async function main() {
  console.log('🌱 Seeding login users (admin@nexus.com, alumni@nexus.com, student@nexus.com)...');
  await upsertUser('admin@nexus.com', 'Local Admin', 'ADMIN');
  await upsertUser('alumni@nexus.com', 'Local Alumni', 'ALUM');
  await upsertUser('student@nexus.com', 'Local Student', 'STUDENT');
  console.log('🎉 Done. Default password: "abcdef"');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
