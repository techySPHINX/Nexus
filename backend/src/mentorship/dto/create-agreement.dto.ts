
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAgreementDto {
  @IsNotEmpty()
  @IsString()
  mentorshipId: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
