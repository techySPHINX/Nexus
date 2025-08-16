import {
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Data transfer object for updating a user profile.
 */
export class UpdateProfileDto {
  /**
   * A short biography about the user.
   * @example "Passionate software engineer with a focus on web development."
   */
  @IsOptional()
  @IsString()
  bio?: string;

  /**
   * The user's current location.
   * @example "San Francisco, CA"
   */
  @IsOptional()
  @IsString()
  location?: string;

  /**
   * A comma-separated string of the user's interests.
   * @example "coding, hiking, photography"
   */
  @IsOptional()
  @IsString()
  interests?: string;

  /**
   * An array of skills the user possesses.
   * @example ["TypeScript", "NestJS", "React"]
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string')
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return value;
  })
  skills?: string[];

  /**
   * URL to the user's avatar image.
   * Must be a valid URL starting with http or https.
   * @example "https://example.com/avatar.jpg"
   */
  @IsOptional()
  @IsString()
  @MaxLength(512, { message: 'Avatar URL must be less than 512 characters.' })
  @Matches(/^https?:\/\//, {
    message: 'Avatar URL must start with http or https.',
  })
  avatarUrl?: string;
}
