import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateSubCommunityTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
