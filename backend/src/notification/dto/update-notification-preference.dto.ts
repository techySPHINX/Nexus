import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateNotificationPreferenceDto {
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  digestModeEnabled?: boolean;

  @IsOptional()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY'])
  digestFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  notifyOnFollow?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  notifyOnFlairAssign?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  notifyOnBadgeAward?: boolean;
}
