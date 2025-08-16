import { IsEnum } from 'class-validator';

enum MentorshipRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class UpdateMentorshipRequestDto {
  @IsEnum(MentorshipRequestStatus)
  status: MentorshipRequestStatus;
}
