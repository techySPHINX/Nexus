/**
 * Data transfer object for authentication responses.
 */
export class AuthResponseDto {
  /**
   * The JWT access token.
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  accessToken: string;

  /**
   * The authenticated user's information.
   */
  user: {
    /**
     * The user's unique identifier.
     * @example "clyxa6g3j0000u069f3g1h2k4"
     */
    id: string;

    /**
     * The user's email address.
     * @example "user@example.com"
     */
    email: string;

    /**
     * The user's name.
     * @example "John Doe"
     */
    name: string;

    /**
     * The user's role.
     * @example "STUDENT"
     */
    role: 'STUDENT' | 'ALUM' | 'ADMIN';

    /**
     * Indicates whether the user's email has been verified.
     * @example true
     */
    emailVerified: boolean;

    /**
     * Indicates whether the user has completed their profile.
     * @example false
     */
    profileCompleted: boolean;

    /**
     * The user's profile information.
     */
    profile?: any;
  };
}
