import { IsString, IsOptional, IsUrl, IsArray, IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsEnum(ProjectStatus)
  status: ProjectStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seeking?: string[];
}
