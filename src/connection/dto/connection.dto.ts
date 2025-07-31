import { IsEnum, IsUUID } from 'class-validator';

export class CreateConnectionDto {
  @IsUUID()
  recipientId: string;
}

export class UpdateConnectionStatusDto {
  @IsUUID()
  connectionId: string;

  @IsEnum(['ACCEPTED', 'REJECTED', 'BLOCKED'])
  status: 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
}
