import { IsOptional, IsString, IsArray, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  interests?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') return value.split(',').map(s => s.trim()).filter(Boolean);
    return value;
  })
  skills?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(512, { message: 'Avatar URL must be less than 512 characters.' })
  @Matches(/^https?:\/\//, { message: 'Avatar URL must start with http or https.' })
  avatarUrl?: string;
}