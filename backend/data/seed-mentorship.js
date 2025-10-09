import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMentorship() {
  try {
    console.log('🌱 Seeding mentorship data...');

    // Get users with MENTOR role
    const mentors = await prisma.user.findMany({
      where: { role: 'MENTOR' },
      include: { profile: true }
    });

    // Get students and alumni
    const mentees = await prisma.user.findMany({
      where: { 
        role: { in: ['STUDENT', 'ALUM'] }
      },
      include: { profile: true }
    });

    console.log(`Found ${mentors.length} mentors and ${mentees.length} potential mentees`);

    if (mentors.length === 0 || mentees.length === 0) {
      console.log('❌ Need mentors and mentees to create mentorship data');
      return;
    }

    // Create mentorship listings
    const listings = [
      {
        mentorId: mentors[0].id,
        title: "Full-Stack Web Development",
        description: "Learn modern web development with React, Node.js, and databases. Perfect for beginners and intermediate developers.",
        skills: ["React", "Node.js", "JavaScript", "MongoDB", "Express"],
        goals: ["Build a complete web application", "Learn REST API design", "Understand database design"],
        communicationChannels: ["Slack", "Zoom", "Email"],
        availability: "Weekends and evenings"
      },
      {
        mentorId: mentors[0].id,
        title: "Career Transition to Tech",
        description: "Guidance for professionals looking to transition into the tech industry. Cover resume building, interview prep, and skill development.",
        skills: ["Career Planning", "Interview Skills", "Resume Writing", "Networking"],
        goals: ["Land first tech job", "Build professional network", "Develop technical skills"],
        communicationChannels: ["LinkedIn", "Zoom", "Email"],
        availability: "Weekdays after 6 PM"
      }
    ];

    for (const listingData of listings) {
      try {
        const listing = await prisma.mentorshipListing.create({
          data: listingData,
          include: {
            mentor: { select: { name: true, email: true } }
          }
        });
        console.log(`✅ Created mentorship listing: "${listing.title}" by ${listing.mentor.name}`);
      } catch (error) {
        console.log(`❌ Error creating listing: ${error.message}`);
      }
    }

    // Create mentorship applications
    const applications = [
      {
        menteeId: mentees[0].id,
        listingId: (await prisma.mentorshipListing.findFirst())?.id,
        message: "Hi! I'm a final year CSE student and I'm very interested in learning full-stack development. I have some experience with React but would love to learn more about backend development."
      },
      {
        menteeId: mentees[1].id,
        listingId: (await prisma.mentorshipListing.findFirst())?.id,
        message: "Hello! I'm looking to transition from my current role to a tech position. I've been learning programming on my own but would benefit greatly from professional guidance."
      }
    ].filter(app => app.listingId);

    for (const appData of applications) {
      try {
        const application = await prisma.mentorshipApplication.create({
          data: appData,
          include: {
            mentee: { select: { name: true, email: true } },
            listing: { select: { title: true } }
          }
        });
        console.log(`✅ Created mentorship application: ${application.mentee.name} for "${application.listing.title}"`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Application already exists for this mentee and listing`);
        } else {
          console.log(`❌ Error creating application: ${error.message}`);
        }
      }
    }

    // Create active mentorships
    const mentorships = [
      {
        mentorId: mentors[0].id,
        menteeId: mentees[0].id,
        progress: 25.0
      }
    ];

    for (const mentorshipData of mentorships) {
      try {
        const mentorship = await prisma.mentorship.create({
          data: mentorshipData,
          include: {
            mentor: { select: { name: true } },
            mentee: { select: { name: true } }
          }
        });
        console.log(`✅ Created active mentorship: ${mentorship.mentor.name} → ${mentorship.mentee.name}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ Mentorship already exists between these users`);
        } else {
          console.log(`❌ Error creating mentorship: ${error.message}`);
        }
      }
    }

    console.log('🎉 Mentorship data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding mentorship data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedMentorship();
