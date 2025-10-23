/**
 * Enhanced authentication response DTO
 */
export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isEmailVerified: boolean;
    accountStatus: string;
    profileCompleted: boolean;
  };
  expiresIn: number;
}
