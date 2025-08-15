import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubCommunityRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  rules: string;
}
