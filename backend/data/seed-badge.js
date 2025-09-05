import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedBadges = async () => {
  const badges = [
    {
      name: 'JavaScript Master',
      description: 'Awarded for mastering JavaScript fundamentals.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    },
    {
      name: 'React Expert',
      description: 'Recognized for advanced React skills.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    },
    {
      name: 'Node.js Ninja',
      description: 'Demonstrated expertise in Node.js backend development.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    },
    {
      name: 'Python Pro',
      description: 'Excelled in Python programming.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    },
    {
      name: 'Database Guru',
      description: 'Outstanding knowledge of databases.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    },
    {
      name: 'UI Designer',
      description: 'Exceptional skills in UI/UX design.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
    },
    {
      name: 'Git Collaborator',
      description: 'Proficient in Git version control.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
    },
    {
      name: 'TypeScript Ace',
      description: 'Mastered TypeScript for scalable apps.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    },
    {
      name: 'Cloud Pioneer',
      description: 'Experience with cloud platforms.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/aws/aws-original.svg',
    },
    {
      name: 'Linux Enthusiast',
      description: 'Comfortable working in Linux environments.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
    },
    {
      name: 'Docker Captain',
      description: 'Skilled in containerization with Docker.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    },
    {
      name: 'Mentor',
      description: 'Provided mentorship to peers.',
      icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    },
    {
      name: 'Open Source Contributor',
      description: 'Contributed to open source projects.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
    },
    {
      name: 'Hackathon Winner',
      description: 'Won a hackathon event.',
      icon: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    },
    {
      name: 'Bug Squasher',
      description: 'Fixed critical bugs in production.',
      icon: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
    },
    {
      name: 'Team Player',
      description: 'Excelled in collaborative projects.',
      icon: 'https://cdn-icons-png.flaticon.com/512/1946/1946429.png',
    },
    {
      name: 'Presentation Pro',
      description: 'Delivered outstanding tech presentations.',
      icon: 'https://cdn-icons-png.flaticon.com/512/2983/2983798.png',
    },
    {
      name: 'Mobile Developer',
      description: 'Built mobile applications.',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/android/android-original.svg',
    },
    {
      name: 'Security Advocate',
      description: 'Promoted secure coding practices.',
      icon: 'https://cdn-icons-png.flaticon.com/512/3064/3064197.png',
    },
    {
      name: 'Continuous Learner',
      description: 'Consistently upskilled and learned new tech.',
      icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png',
    },
  ];

  for (const badge of badges) {
    await prisma.badge.create({ data: badge });
  }
};

seedBadges()
  .catch((e) => console.error(e))
  .finally(async () => {
    console.log('✅ Seeding badges completed.');
    await prisma.$disconnect();
  });
