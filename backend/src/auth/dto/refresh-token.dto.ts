import { IsString, IsOptional } from 'class-validator';

/**
 * DTO for refreshing access tokens
 */
export class RefreshTokenDto {
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
