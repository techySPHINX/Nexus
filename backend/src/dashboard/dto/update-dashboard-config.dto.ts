import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const ROLE_PRESETS = ['STUDENT', 'ALUM', 'ADMIN'] as const;

class LayoutItemDto {
  @IsString()
  i: string;

  @IsInt()
  @Min(0)
  x: number;

  @IsInt()
  @Min(0)
  y: number;

  @IsInt()
  @Min(1)
  w: number;

  @IsInt()
  @Min(1)
  h: number;
}

class WidgetSettingsDto {
  @IsBoolean()
  visible: boolean;

  @IsOptional()
  settings?: Record<string, unknown>;
}

export class UpdateDashboardConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutItemDto)
  layout: LayoutItemDto[];

  @IsOptional()
  widgets?: Record<string, WidgetSettingsDto>;

  @IsOptional()
  @IsString()
  @IsIn(ROLE_PRESETS)
  preset?: (typeof ROLE_PRESETS)[number];
}
