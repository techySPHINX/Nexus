import { IsArray, IsOptional, IsString } from 'class-validator';

export class SearchMentorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  availability?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  communicationChannels?: string[];
}
