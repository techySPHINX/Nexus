import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateMentorSettingsDto {
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsString()
  @IsOptional()
  bio?: string;
}
