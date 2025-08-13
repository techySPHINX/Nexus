import { IsString, IsNotEmpty } from 'class-validator';

export class EndorseSkillDto {
  @IsString()
  @IsNotEmpty()
  skillId: string;
}
