import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateMentorshipRequestDto {
  @IsUUID()
  mentorId: string;

  @IsString()
  @IsOptional()
  message?: string;
}
