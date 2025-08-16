
import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateMeetingDto {
  @IsNotEmpty()
  @IsString()
  mentorshipId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  startTime: Date;

  @IsNotEmpty()
  @IsDateString()
  endTime: Date;
}
