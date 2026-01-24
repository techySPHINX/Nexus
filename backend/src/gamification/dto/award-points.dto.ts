import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class AwardPointsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  points: number;

  @IsString()
  @IsNotEmpty()
  type: string; // e.g., "POST_CREATED", "LIKE_RECEIVED", "COMMUNITY_JOINED"

  @IsString()
  @IsOptional()
  message: string;

  @IsString()
  @IsOptional()
  entityId?: string;
}
