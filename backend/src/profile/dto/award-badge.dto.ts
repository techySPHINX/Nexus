import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Data transfer object for awarding a badge to a user.
 */
export class AwardBadgeDto {
  /**
   * The ID of the badge to award.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsString()
  @IsNotEmpty()
  badgeId: string;
}
