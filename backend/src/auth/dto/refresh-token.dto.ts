import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for refreshing access tokens
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
