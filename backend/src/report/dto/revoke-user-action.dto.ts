import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RevokeUserActionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Revocation reason must be at least 10 characters' })
  @MaxLength(500, { message: 'Revocation reason cannot exceed 500 characters' })
  reason: string;
}
