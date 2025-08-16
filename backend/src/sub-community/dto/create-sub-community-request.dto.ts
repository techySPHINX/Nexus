import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSubCommunityRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  rules: string; // Rules and regulations for the sub-community
}
