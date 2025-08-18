import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateMentorshipListingDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsArray()
  @IsString({ each: true })
  goals: string[];

  @IsArray()
  @IsString({ each: true })
  communicationChannels: string[];

  @IsNotEmpty()
  @IsString()
  availability: string;
}
