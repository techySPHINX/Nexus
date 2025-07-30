export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: 'STUDENT' | 'ALUM' | 'ADMIN';
    profileCompleted: boolean;
  };
}
