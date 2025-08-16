
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

export class UpdateMentorshipProgressDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;
}
