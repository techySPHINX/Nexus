import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum FrontendErrorBoundaryScope {
  GLOBAL = 'global',
  ROUTE = 'route',
}

export class FrontendErrorReportDto {
  @ApiProperty({
    description: 'High-level error message from frontend runtime',
    example: 'Cannot read properties of undefined (reading "map")',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({
    description: 'JavaScript stack trace',
  })
  @IsOptional()
  @IsString()
  @MaxLength(12000)
  stack?: string;

  @ApiPropertyOptional({
    description: 'React component stack from ErrorBoundary',
  })
  @IsOptional()
  @IsString()
  @MaxLength(12000)
  componentStack?: string;

  @ApiProperty({
    description: 'Boundary scope that captured the exception',
    enum: FrontendErrorBoundaryScope,
  })
  @IsEnum(FrontendErrorBoundaryScope)
  boundary: FrontendErrorBoundaryScope;

  @ApiProperty({
    description: 'Browser route at the time of the error',
    example: '/projects',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  route: string;

  @ApiProperty({
    description: 'Browser user-agent string',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  userAgent: string;

  @ApiProperty({
    description: 'Client timestamp in ISO format',
    example: '2026-03-09T11:47:31.000Z',
  })
  @IsISO8601()
  timestamp: string;
}
