import { IsString, IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubCommunityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @IsString()
  @IsNotEmpty()
  ownerId: string; // This will be the ID of the alumnus who requested it
}
