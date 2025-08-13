import { IsOptional, IsString, IsArray, MinLength } from 'class-validator';

/**
 * Data transfer object for updating a user.
 */
export class UpdateUserDto {
  /**
   * The user's name.
   * @example "John Doe"
   */
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * The user's password.
   * @example "newpassword123"
   */
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  /**
   * The user's biography.
   * @example "Software developer from San Francisco."
   */
  @IsOptional()
  @IsString()
  bio?: string;

  /**
   * The user's location.
   * @example "San Francisco, CA"
   */
  @IsOptional()
  @IsString()
  location?: string;

  /**
   * The user's interests.
   * @example "Programming, hiking, photography"
   */
  @IsOptional()
  @IsString()
  interests?: string;

  /**
   * The user's skills.
   * @example ["JavaScript", "TypeScript", "Node.js"]
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}
