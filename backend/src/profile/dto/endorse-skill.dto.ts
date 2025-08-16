import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Data transfer object for endorsing a skill.
 */
export class EndorseSkillDto {
  /**
   * The ID of the skill to endorse.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsString()
  @IsNotEmpty()
  skillId: string;
}
