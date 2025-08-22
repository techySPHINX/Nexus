import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AgreementStatus } from '@prisma/client';

export class UpdateAgreementDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(AgreementStatus)
  status?: AgreementStatus;
}
