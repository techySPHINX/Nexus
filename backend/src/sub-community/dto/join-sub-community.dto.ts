import { IsString, IsNotEmpty } from 'class-validator';

export class JoinSubCommunityDto {
  @IsString()
  @IsNotEmpty()
  subCommunityId: string;
}
