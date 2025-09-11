import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const seedSkills = async () => {
  const skills = [
    { name: 'JavaScript' },
    { name: 'React' },
    { name: 'Node.js' },
    { name: 'Python' },
    { name: 'Django' },
    { name: 'Flask' },
    { name: 'Ruby on Rails' },
    { name: 'Java' },
    { name: 'Spring Boot' },
    { name: 'C#' },
    { name: '.NET' },
    { name: 'PHP' },
    { name: 'Laravel' },
    { name: 'HTML' },
    { name: 'CSS' },
    { name: 'Sass' },
    { name: 'Tailwind CSS' },
    { name: 'SQL' },
    { name: 'PostgreSQL' },
    { name: 'MySQL' },
    { name: 'MongoDB' },
    { name: 'GraphQL' },
    { name: 'TypeScript' },
    { name: 'AWS' },
    { name: 'Azure' },
    { name: 'Docker' },
    { name: 'Kubernetes' },
    { name: 'Git' },
    { name: 'Linux' },
    { name: 'Agile Methodologies' },
    { name: 'Scrum' },
    { name: 'RESTful APIs' },
  ];

  try {
    console.log('🌱 Seeding database with test skills...');
    await prisma.skill.createMany({
      data: skills,
      skipDuplicates: true, // Skip duplicates based on the unique constraint
    });
    console.log('✅ Seeding completed.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedSkills();
