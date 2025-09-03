import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProjectUpdateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
