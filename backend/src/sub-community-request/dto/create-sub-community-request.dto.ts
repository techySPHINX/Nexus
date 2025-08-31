import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';

const COMMUNITY_TYPES = [
  'TECH',
  'GAME',
  'MUSIC',
  'SPORT',
  'ART',
  'SCIENCE',
  'EDUCATION',
  'ENTERTAINMENT',
  'LIFESTYLE',
  'OTHER',
] as const;

export class CreateSubCommunityRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(COMMUNITY_TYPES)
  type: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  rules: string;
}
