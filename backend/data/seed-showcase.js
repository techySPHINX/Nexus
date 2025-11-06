const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedShowcase() {
  try {
    console.log('🌱 Seeding showcase data...');

    // Get users to create projects
    const users = await prisma.user.findMany({
      where: { 
        role: { in: ['STUDENT', 'ALUM', 'MENTOR'] }
      },
      include: { profile: true }
    });

    console.log(`Found ${users.length} users for showcase`);

    if (users.length === 0) {
      console.log('❌ Need users to create showcase data');
      return;
    }

    // Create projects
    const projects = [
      {
        ownerId: users[0].id,
        title: "AI-Powered Study Assistant",
        description: "An intelligent study assistant that helps students organize their learning materials, track progress, and provides personalized study recommendations using machine learning algorithms.",
        githubUrl: "https://github.com/user1/ai-study-assistant",
        websiteUrl: "https://ai-study-assistant.vercel.app",
        imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=500",
        videoUrl: "https://youtube.com/watch?v=demo1",
        tags: ["AI", "Machine Learning", "Education", "React", "Python"],
        skills: ["React", "Python", "TensorFlow", "Node.js", "MongoDB"],
        status: "IN_PROGRESS",
        seeking: ["Frontend Developer", "UI/UX Designer", "ML Engineer"]
      },
      {
        ownerId: users[1].id,
        title: "EcoTrack - Environmental Monitoring App",
        description: "A mobile application that helps users track their carbon footprint, provides eco-friendly alternatives, and connects users with local environmental initiatives.",
        githubUrl: "https://github.com/user2/ecotrack",
        websiteUrl: "https://ecotrack.app",
        imageUrl: "https://images.unsplash.com/photo-1569163139394-de4468c4e4b8?w=500",
        tags: ["Environment", "Mobile App", "React Native", "Sustainability"],
        skills: ["React Native", "Firebase", "JavaScript", "Google Maps API"],
        status: "COMPLETED",
        seeking: ["Marketing Specialist", "Content Creator"]
      },
      {
        ownerId: users[2].id,
        title: "Blockchain Voting System",
        description: "A secure and transparent voting system built on blockchain technology to ensure election integrity and prevent fraud.",
        githubUrl: "https://github.com/user3/blockchain-voting",
        websiteUrl: "https://secure-vote.eth",
        imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500",
        tags: ["Blockchain", "Ethereum", "Smart Contracts", "Security"],
        skills: ["Solidity", "Web3.js", "React", "Ethereum"],
        status: "IDEA",
        seeking: ["Blockchain Developer", "Security Expert", "UI Designer"]
      },
      {
        ownerId: users[1].id,
        title: "Virtual Reality Learning Platform",
        description: "An immersive VR platform for interactive learning experiences, particularly focused on science and history education.",
        githubUrl: "https://github.com/user4/vr-learning",
        websiteUrl: "https://vr-learning.com",
        imageUrl: "https://images.unsplash.com/photo-1592478411213-6153e4c4a7b0?w=500",
        tags: ["VR", "Education", "Unity", "3D Modeling"],
        skills: ["Unity", "C#", "Blender", "VR Development"],
        status: "IN_PROGRESS",
        seeking: ["3D Artist", "VR Developer", "Educational Content Creator"]
      },
      {
        ownerId: users[2].id,
        title: "Smart Home Automation Hub",
        description: "A centralized hub for managing all smart home devices with voice control, automation rules, and energy monitoring.",
        githubUrl: "https://github.com/user5/smart-home-hub",
        websiteUrl: "https://smarthome-hub.local",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500",
        tags: ["IoT", "Smart Home", "Raspberry Pi", "Automation"],
        skills: ["Python", "Raspberry Pi", "MQTT", "Home Assistant"],
        status: "COMPLETED",
        seeking: ["Hardware Engineer", "Mobile Developer"]
      }
    ];

    for (const projectData of projects) {
      try {
        const project = await prisma.project.create({
          data: projectData,
          include: {
            owner: { select: { name: true, email: true } }
          }
        });
        console.log(`✅ Created project: "${project.title}" by ${project.owner.name}`);
      } catch (error) {
        console.log(`❌ Error creating project: ${error.message}`);
      }
    }

    // Create startups - create several varied startups. founderId will be assigned from available users
    const startupTemplates = [
      {
        name: 'TechFlow Solutions',
        description:
          'A startup focused on developing AI-powered workflow automation tools for small and medium businesses.',
        imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=500',
        websiteUrl: 'https://techflow-solutions.com',
        status: 'BETA',
        fundingGoal: 500000,
        fundingRaised: 250000,
        monetizationModel: ['SaaS Subscription'],
      },
      {
        name: 'GreenTech Innovations',
        description:
          'Developing sustainable technology solutions for renewable energy and environmental conservation.',
        imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=500',
        websiteUrl: 'https://greentech-innovations.com',
        status: 'PROTOTYPING',
        fundingGoal: 1000000,
        fundingRaised: 150000,
        monetizationModel: ['Product Sales', 'Consulting'],
      },
      {
        name: 'Campus Connect',
        description:
          'A networking platform tailored for students and alumni to share internships, projects and mentorship opportunities.',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500',
        websiteUrl: 'https://campus-connect.edu',
        status: 'LAUNCHED',
        fundingGoal: 20000,
        fundingRaised: 45000,
        monetizationModel: ['Freemium', 'Premium Subscriptions'],
      },
      {
        name: 'MediMap',
        description:
          'A telemedicine and appointment-management platform connecting students with local health services.',
        imageUrl: 'https://images.unsplash.com/photo-1580281657521-0a38d4b7c0d6?w=500',
        websiteUrl: 'https://medimap.health',
        status: 'BETA',
        fundingGoal: 150000,
        fundingRaised: 40000,
        monetizationModel: ['Subscription', 'Per-appointment Fee'],
      },
      {
        name: 'LearnLoop',
        description:
          'Micro-courses marketplace where instructors sell short practical courses and students earn badges.',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500',
        websiteUrl: 'https://learnloop.com',
        status: 'PROTOTYPING',
        fundingGoal: 0,
        fundingRaised: 0,
        monetizationModel: ['Course Sales', 'Revenue Share'],
      },
      {
        name: 'SupplySmart',
        description:
          'A B2B procurement assistant that helps small teams source cheaper supplies and track orders.',
        imageUrl: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=500',
        websiteUrl: 'https://supplysmart.co',
        status: 'IDEA',
        fundingGoal: 75000,
        fundingRaised: 5000,
        monetizationModel: ['Commission', 'SaaS'],
      },
    ];

    for (let i = 0; i < startupTemplates.length; i++) {
      const template = startupTemplates[i];
      const founder = users[i % users.length];
      const startupData = { ...template, founderId: founder.id };
      try {
        const startup = await prisma.startup.create({
          data: startupData,
          include: {
            founder: { select: { name: true, email: true } },
          },
        });
        console.log(`✅ Created startup: "${startup.name}" by ${startup.founder.name}`);
      } catch (error) {
        console.log(`❌ Error creating startup: ${error.message}`);
      }
    }

    // Create project updates
    const projectsWithUpdates = await prisma.project.findMany({ take: 3 });
    
    for (const project of projectsWithUpdates) {
      const updates = [
        {
          projectId: project.id,
          authorId: project.ownerId,
          title: "Initial Development Phase Complete",
          content: "We've successfully completed the initial development phase. The core functionality is now working and we're ready to move to the next phase of development."
        },
        {
          projectId: project.id,
          authorId: project.ownerId,
          title: "UI/UX Design Updates",
          content: "Our design team has created beautiful mockups for the user interface. The new design is more intuitive and user-friendly."
        }
      ];

      for (const updateData of updates) {
        try {
          const update = await prisma.projectUpdate.create({
            data: updateData,
            include: {
              project: { select: { title: true } },
              author: { select: { name: true } }
            }
          });
          console.log(`✅ Created project update: "${update.title}" for "${update.project.title}"`);
        } catch (error) {
          console.log(`❌ Error creating update: ${error.message}`);
        }
      }
    }

    console.log('🎉 Showcase data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding showcase data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedShowcase();
