import { IsNotEmpty, IsString } from 'class-validator';

export class ApplyToMentorshipListingDto {
  @IsNotEmpty()
  @IsString()
  message: string;
}
