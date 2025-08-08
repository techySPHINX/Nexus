export class AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'STUDENT' | 'ALUM' | 'ADMIN';
    profileCompleted: boolean;
    profile?: any;
  };
}
