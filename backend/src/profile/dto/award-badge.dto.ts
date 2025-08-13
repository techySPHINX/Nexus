import { IsString, IsNotEmpty } from 'class-validator';

export class AwardBadgeDto {
  @IsString()
  @IsNotEmpty()
  badgeId: string;
}
