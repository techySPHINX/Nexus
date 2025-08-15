import { IsString, IsOptional } from 'class-validator';

export class CreateCollaborationRequestDto {
  @IsString()
  @IsOptional()
  message?: string;
}
