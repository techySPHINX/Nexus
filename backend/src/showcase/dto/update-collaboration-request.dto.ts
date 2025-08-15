import { IsEnum } from 'class-validator';

enum CollaborationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class UpdateCollaborationRequestDto {
  @IsEnum(CollaborationStatus)
  status: CollaborationStatus;
}
