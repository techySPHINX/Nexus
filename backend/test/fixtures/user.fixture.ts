import { Role } from '@prisma/client';

/**
 * Test fixtures for users
 */
export const userFixtures = {
  student: {
    id: 'student-1',
    email: 'student@kiit.ac.in',
    password: '$2b$10$abcdefghijklmnopqrstuv', // bcrypt hash
    name: 'Test Student',
    role: Role.STUDENT,
    isEmailVerified: true,
    isAccountActive: true,
    accountStatus: 'ACTIVE',
    graduationYear: 2025,
  },

  alumni: {
    id: 'alumni-1',
    email: 'alumni@kiit.ac.in',
    password: '$2b$10$abcdefghijklmnopqrstuv',
    name: 'Test Alumni',
    role: Role.ALUM,
    isEmailVerified: true,
    isAccountActive: true,
    accountStatus: 'ACTIVE',
    graduationYear: 2020,
  },

  admin: {
    id: 'admin-1',
    email: 'admin@kiit.ac.in',
    password: '$2b$10$abcdefghijklmnopqrstuv',
    name: 'Test Admin',
    role: Role.ADMIN,
    isEmailVerified: true,
    isAccountActive: true,
    accountStatus: 'ACTIVE',
  },

  mentor: {
    id: 'mentor-1',
    email: 'mentor@kiit.ac.in',
    password: '$2b$10$abcdefghijklmnopqrstuv',
    name: 'Test Mentor',
    role: Role.MENTOR,
    isEmailVerified: true,
    isAccountActive: true,
    accountStatus: 'ACTIVE',
    graduationYear: 2018,
  },

  unverified: {
    id: 'unverified-1',
    email: 'unverified@kiit.ac.in',
    password: '$2b$10$abcdefghijklmnopqrstuv',
    name: 'Unverified User',
    role: Role.STUDENT,
    isEmailVerified: false,
    isAccountActive: false,
    accountStatus: 'PENDING_EMAIL_VERIFICATION',
  },

  banned: {
    id: 'banned-1',
    email: 'banned@kiit.ac.in',
    password: '$2b$10$abcdefghijklmnopqrstuv',
    name: 'Banned User',
    role: Role.STUDENT,
    isEmailVerified: true,
    isAccountActive: false,
    accountStatus: 'BANNED',
  },
};

export const profileFixtures = {
  student: {
    userId: 'student-1',
    bio: 'Computer Science Student',
    location: 'Bhubaneswar',
    interests: 'Web Development, AI',
    avatarUrl: 'https://example.com/avatar.jpg',
    dept: 'CSE',
    studentId: 'KIIT001',
  },

  alumni: {
    userId: 'alumni-1',
    bio: 'Software Engineer at Google',
    location: 'San Francisco',
    interests: 'Backend Development, Cloud',
    avatarUrl: 'https://example.com/alumni-avatar.jpg',
    dept: 'CSE',
    studentId: 'KIIT002',
  },
};
