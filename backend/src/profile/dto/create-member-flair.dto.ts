import { IsBoolean, IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMemberFlairDto {
  @IsString()
  @MaxLength(32)
  label: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isActive?: boolean;
}
