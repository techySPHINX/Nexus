import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class ConnectionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['STUDENT', 'ALUM', 'ADMIN'])
  role?: 'STUDENT' | 'ALUM' | 'ADMIN';

  @IsOptional()
  @IsString()
  search?: string;
}
