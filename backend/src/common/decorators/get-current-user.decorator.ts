import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom parameter decorator to extract the current user from the request object.
 * This decorator is typically used in conjunction with authentication guards (e.g., JwtAuthGuard)
 * which attach user information to the request.
 *
 * @param data - Optional. A string key to extract a specific property from the user object (e.g., 'sub', 'email').
 *               If omitted, the entire user object is returned.
 * @param context - The execution context, providing access to the request object.
 * @returns The user object or a specific property from it.
 *
 * @example
 * // To get the entire user object:
 * `@GetCurrentUser() user: User`
 *
 * @example
 * // To get a specific property (e.g., userId which is typically 'sub'):
 * `@GetCurrentUser('sub') userId: string`
 */
export const GetCurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
