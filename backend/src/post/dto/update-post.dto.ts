import { IsOptional, IsString } from 'class-validator';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  imageFile?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
