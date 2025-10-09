import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Data transfer object for removing an endorsement.
 */
export class RemoveEndorsementDto {
  /**
   * The ID of the skill endorsement to remove.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsString()
  @IsNotEmpty()
  endorsementId: string;
}
