import { IsArray, IsString, IsOptional } from 'class-validator';

export class UpdateMentorshipListingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  communicationChannels?: string[];

  @IsOptional()
  @IsString()
  availability?: string;
}
