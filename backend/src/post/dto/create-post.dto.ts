import { IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  type?: string; // e.g., "JOB", "UPDATE", "ANNOUNCEMENT"
}
