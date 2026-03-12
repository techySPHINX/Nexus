const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const FEED_IMAGES = [
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200',
  'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=1200',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200',
];

const postTemplates = [
  {
    subject: 'Open-source sprint this weekend',
    content:
      'A few of us are planning a focused open-source sprint on Saturday. If you are into React, Node.js, testing, or docs, join in. We will pair on issues and ship at least one useful contribution each.',
    type: 'DISCUSSION',
    isUrgent: false,
    status: 'APPROVED',
  },
  {
    subject: 'Looking for teammate: campus mobility app',
    content:
      'I am building a campus mobility app with route suggestions, shuttle tracking, and late-evening safety alerts. Looking for one frontend engineer and one designer. DM if interested.',
    type: 'COLLABORATION',
    isUrgent: false,
    status: 'APPROVED',
  },
  {
    subject: 'Internship prep resources for SDE roles',
    content:
      'Sharing a practical prep stack that worked for me: DSA patterns, system design notes, resume bullets, and mock interview templates. Happy to host a session for juniors next week.',
    type: 'RESOURCE',
    isUrgent: false,
    status: 'APPROVED',
  },
  {
    subject: 'Hackathon team formation - AI + Healthcare',
    content:
      'We are forming a hackathon team around AI-assisted triage and appointment routing. Need one ML engineer and one backend dev. Project scope is realistic for 36 hours and demo-ready.',
    type: 'COLLABORATION',
    isUrgent: true,
    status: 'APPROVED',
  },
  {
    subject: 'Career AMA with alumni this Friday',
    content:
      'Hosting an AMA with alumni from product, backend, and data roles. Drop your questions in comments and we will prioritize by demand. Session recording and summary notes will be posted.',
    type: 'EVENT',
    isUrgent: false,
    status: 'APPROVED',
  },
];

const commentTemplates = [
  'Count me in. I can help with frontend and testing.',
  'Great initiative. Could you share the exact timeline and milestones?',
  'I can contribute to backend APIs and deployment pipelines.',
  'This is very relevant. Please post a follow-up checklist after kickoff.',
  'Nice work. If you need design feedback, I can review wireframes.',
  'Thanks for sharing this. Super useful for our batch.',
];

async function seedPosts() {
  try {
    console.log('🌱 Seeding posts and comments...');

    const users = await prisma.user.findMany({
      where: { isAccountActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { createdAt: 'asc' },
      take: 12,
    });

    const communities = await prisma.subCommunity.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
      take: 12,
    });

    if (users.length < 3) {
      console.log('❌ Need at least 3 active users to seed posts/comments.');
      return;
    }

    const seededPosts = [];

    for (let i = 0; i < postTemplates.length; i++) {
      const template = postTemplates[i];
      const author = users[i % users.length];
      const community = communities.length > 0 ? communities[i % communities.length] : null;

      const postData = {
        authorId: author.id,
        subject: template.subject,
        content: template.content,
        imageUrl: FEED_IMAGES[i % FEED_IMAGES.length],
        type: template.type,
        isUrgent: template.isUrgent,
        status: template.status,
        subCommunityId: community?.id ?? null,
      };

      const existing = await prisma.post.findFirst({
        where: {
          authorId: postData.authorId,
          subject: postData.subject,
        },
      });

      const post = existing
        ? await prisma.post.update({
            where: { id: existing.id },
            data: postData,
            include: {
              author: { select: { name: true } },
              subCommunity: { select: { name: true } },
            },
          })
        : await prisma.post.create({
            data: postData,
            include: {
              author: { select: { name: true } },
              subCommunity: { select: { name: true } },
            },
          });

      seededPosts.push(post);
      console.log(
        `✅ ${existing ? 'Updated' : 'Created'} post: "${post.subject}" by ${post.author.name}`
      );
    }

    for (let i = 0; i < seededPosts.length; i++) {
      const post = seededPosts[i];
      const primaryCommenter = users[(i + 1) % users.length];
      const secondaryCommenter = users[(i + 2) % users.length];

      const primaryCommentText = commentTemplates[i % commentTemplates.length];
      const secondaryCommentText = commentTemplates[(i + 3) % commentTemplates.length];

      const primaryExisting = await prisma.comment.findFirst({
        where: {
          postId: post.id,
          userId: primaryCommenter.id,
          content: primaryCommentText,
          parentId: null,
        },
      });

      const primaryComment = primaryExisting
        ? await prisma.comment.update({
            where: { id: primaryExisting.id },
            data: { content: primaryCommentText },
          })
        : await prisma.comment.create({
            data: {
              postId: post.id,
              userId: primaryCommenter.id,
              content: primaryCommentText,
            },
          });

      const secondaryExisting = await prisma.comment.findFirst({
        where: {
          postId: post.id,
          userId: secondaryCommenter.id,
          content: secondaryCommentText,
          parentId: null,
        },
      });

      await (secondaryExisting
        ? prisma.comment.update({
            where: { id: secondaryExisting.id },
            data: { content: secondaryCommentText },
          })
        : prisma.comment.create({
            data: {
              postId: post.id,
              userId: secondaryCommenter.id,
              content: secondaryCommentText,
            },
          }));

      const replyText = 'Love this thread. I can also help coordinate contributors.';
      const replyExisting = await prisma.comment.findFirst({
        where: {
          postId: post.id,
          userId: post.authorId,
          content: replyText,
          parentId: primaryComment.id,
        },
      });

      if (!replyExisting) {
        await prisma.comment.create({
          data: {
            postId: post.id,
            userId: post.authorId,
            content: replyText,
            parentId: primaryComment.id,
          },
        });
      }

      console.log(`💬 Ensured comments for post: "${post.subject}"`);
    }

    console.log('🎉 Posts and comments seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding posts/comments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPosts();
