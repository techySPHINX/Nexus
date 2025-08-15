import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateMentorSettingsDto {
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
