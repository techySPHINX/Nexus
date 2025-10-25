/**
 * Permission system for granular authorization
 */

export enum Permission {
  // User Management
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage:roles',

  // Post Management
  POST_READ = 'post:read',
  POST_CREATE = 'post:create',
  POST_UPDATE = 'post:update',
  POST_DELETE = 'post:delete',
  POST_MODERATE = 'post:moderate',

  // Comment Management
  COMMENT_READ = 'comment:read',
  COMMENT_CREATE = 'comment:create',
  COMMENT_UPDATE = 'comment:update',
  COMMENT_DELETE = 'comment:delete',
  COMMENT_MODERATE = 'comment:moderate',

  // Document Management
  DOCUMENT_READ = 'document:read',
  DOCUMENT_APPROVE = 'document:approve',
  DOCUMENT_REJECT = 'document:reject',

  // Community Management
  COMMUNITY_READ = 'community:read',
  COMMUNITY_CREATE = 'community:create',
  COMMUNITY_UPDATE = 'community:update',
  COMMUNITY_DELETE = 'community:delete',
  COMMUNITY_MODERATE = 'community:moderate',

  // Admin Actions
  ADMIN_ACCESS = 'admin:access',
  ADMIN_REPORTS = 'admin:reports',
  ADMIN_AUDIT_LOGS = 'admin:audit:logs',
  ADMIN_SECURITY = 'admin:security',

  // Mentorship
  MENTORSHIP_READ = 'mentorship:read',
  MENTORSHIP_CREATE = 'mentorship:create',
  MENTORSHIP_MANAGE = 'mentorship:manage',

  // Referrals
  REFERRAL_READ = 'referral:read',
  REFERRAL_CREATE = 'referral:create',
  REFERRAL_MANAGE = 'referral:manage',

  // Events
  EVENT_READ = 'event:read',
  EVENT_CREATE = 'event:create',
  EVENT_UPDATE = 'event:update',
  EVENT_DELETE = 'event:delete',

  // Projects
  PROJECT_READ = 'project:read',
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
}

/**
 * Role-based permission mappings
 */
export const RolePermissions: Record<string, Permission[]> = {
  STUDENT: [
    Permission.USER_READ,
    Permission.POST_READ,
    Permission.POST_CREATE,
    Permission.POST_UPDATE, // Own posts only
    Permission.COMMENT_READ,
    Permission.COMMENT_CREATE,
    Permission.COMMENT_UPDATE, // Own comments only
    Permission.COMMUNITY_READ,
    Permission.MENTORSHIP_READ,
    Permission.MENTORSHIP_CREATE,
    Permission.REFERRAL_READ,
    Permission.EVENT_READ,
    Permission.PROJECT_READ,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE, // Own projects only
  ],

  ALUM: [
    Permission.USER_READ,
    Permission.POST_READ,
    Permission.POST_CREATE,
    Permission.POST_UPDATE, // Own posts only
    Permission.COMMENT_READ,
    Permission.COMMENT_CREATE,
    Permission.COMMENT_UPDATE, // Own comments only
    Permission.COMMUNITY_READ,
    Permission.MENTORSHIP_READ,
    Permission.MENTORSHIP_CREATE,
    Permission.MENTORSHIP_MANAGE, // Can manage own mentorships
    Permission.REFERRAL_READ,
    Permission.REFERRAL_CREATE,
    Permission.REFERRAL_MANAGE, // Can manage own referrals
    Permission.EVENT_READ,
    Permission.EVENT_CREATE,
    Permission.PROJECT_READ,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE, // Own projects only
  ],

  MENTOR: [
    Permission.USER_READ,
    Permission.POST_READ,
    Permission.POST_CREATE,
    Permission.COMMENT_READ,
    Permission.COMMENT_CREATE,
    Permission.COMMUNITY_READ,
    Permission.MENTORSHIP_READ,
    Permission.MENTORSHIP_CREATE,
    Permission.MENTORSHIP_MANAGE,
    Permission.EVENT_READ,
  ],

  ADMIN: [
    // All permissions
    ...Object.values(Permission),
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = RolePermissions[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: string,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: string,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string): Permission[] {
  return RolePermissions[role] || [];
}
