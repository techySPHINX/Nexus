import { IsEnum, IsUUID } from 'class-validator';

enum ProjectRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
}

export class AddTeamMemberDto {
  @IsUUID()
  userId: string;

  @IsEnum(ProjectRole)
  role: ProjectRole;
}
