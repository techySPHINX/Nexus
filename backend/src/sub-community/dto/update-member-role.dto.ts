import { IsEnum, IsNotEmpty } from 'class-validator';
import { SubCommunityRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsEnum(SubCommunityRole)
  @IsNotEmpty()
  role: SubCommunityRole;
}
