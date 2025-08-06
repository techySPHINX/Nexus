import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterMessagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number;
}
