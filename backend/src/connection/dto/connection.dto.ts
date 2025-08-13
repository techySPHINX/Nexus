import {
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data transfer object for creating a new connection request.
 */
export class CreateConnectionDto {
  /**
   * The unique identifier of the user to whom the connection request is sent.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsUUID()
  recipientId: string;
}

/**
 * Data transfer object for updating the status of a connection.
 */
export class UpdateConnectionStatusDto {
  /**
   * The unique identifier of the connection to update.
   * @example "clx0z0z0z0000000000000000"
   */
  @IsUUID()
  connectionId: string;

  /**
   * The new status for the connection.
   * Must be one of 'ACCEPTED', 'REJECTED', or 'BLOCKED'.
   * @example "ACCEPTED"
   */
  @IsEnum(['ACCEPTED', 'REJECTED', 'BLOCKED'])
  status: 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
}

/**
 * Data transfer object for querying connections.
 * Provides options for pagination, filtering by role, and searching.
 */
export class ConnectionQueryDto {
  /**
   * The page number for pagination.
   * Must be an integer greater than or equal to 1.
   * @example 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * The number of connections to return per page.
   * Must be an integer between 1 and 100.
   * @example 20
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * Optional. Filters connections by the role of the connected user.
   * @example "STUDENT"
   */
  @IsOptional()
  @IsEnum(['STUDENT', 'ALUM', 'ADMIN'])
  role?: 'STUDENT' | 'ALUM' | 'ADMIN';

  /**
   * Optional. Searches connections by the connected user's name or email.
   * @example "John Doe"
   */
  @IsOptional()
  @IsString()
  search?: string;
}
