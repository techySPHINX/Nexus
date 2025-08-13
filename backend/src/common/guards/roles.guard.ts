import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * A guard that implements role-based access control.
 * It checks if the authenticated user has one of the roles required for a route.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current request is allowed based on user roles.
   * @param context - The execution context of the request.
   * @returns A boolean indicating whether the request is allowed.
   */
  canActivate(context: ExecutionContext): boolean {
    // Get the roles required for the current handler or class.
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are specified, access is granted.
    if (!requiredRoles) return true;

    // Get the user object from the request (assumes user is attached by an authentication guard).
    const { user } = context.switchToHttp().getRequest();

    // Check if the user's role is included in the required roles.
    return requiredRoles.includes(user.role);
  }
}
