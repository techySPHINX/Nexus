import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  ValidateIf,
  MaxLength,
  MinLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { UserActionType } from '@prisma/client';

export class TakeUserActionDto {
  @IsEnum(UserActionType)
  @IsNotEmpty()
  actionType: UserActionType;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 characters' })
  @MaxLength(1000, { message: 'Reason cannot exceed 1000 characters' })
  reason: string;

  // Required for TEMPORARY_BAN
  @ValidateIf((o) => o.actionType === UserActionType.TEMPORARY_BAN)
  @IsInt({ message: 'Duration in days must be an integer' })
  @Min(1, { message: 'Ban duration must be at least 1 day' })
  @Max(365, { message: 'Ban duration cannot exceed 365 days' })
  durationDays?: number;

  // Required for TEMPORARY_BAN (alternative to durationDays)
  @ValidateIf((o) => o.actionType === UserActionType.TEMPORARY_BAN && !o.durationDays)
  @IsDateString()
  expiresAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Additional notes cannot exceed 2000 characters' })
  notes?: string;
}
