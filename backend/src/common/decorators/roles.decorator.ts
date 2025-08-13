import { SetMetadata } from '@nestjs/common';

/**
 * Key used to store roles metadata.
 */
export const ROLES_KEY = 'roles';

/**
 * Custom decorator to assign roles to a route handler.
 * This metadata can be retrieved by a guard (e.g., RolesGuard)
 * to implement role-based access control.
 *
 * @param roles - A variadic list of strings, where each string represents a role.
 *
 * @example
 * // To allow only 'ADMIN' role:
 * `@Roles('ADMIN')`
 *
 * @example
 * // To allow 'STUDENT' or 'ALUM' roles:
 * `@Roles('STUDENT', 'ALUM')`
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
