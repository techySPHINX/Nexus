import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CreateGoalDto {
  @IsNotEmpty()
  @IsString()
  mentorshipId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  dueDate: Date;
}
