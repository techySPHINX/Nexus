import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Data transfer object for updating an existing post.
 */
export class UpdatePostDto {
  /**
   * Optional. The updated content of the post.
   * @example "Updated content for my project!"
   */
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Post subject cannot exceed 200 characters.' })
  subject?: string;

  /**
   * Optional. The updated content of the post.
   * @example "Updated content for my project!"
   */
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Post content cannot exceed 2000 characters.' })
  content?: string;

  /**
   * Optional. The updated URL of an image associated with the post.
   * This field is typically populated after an image file is uploaded and processed.
   * @example "https://example.com/new_image.jpg"
   */
  @IsOptional()
  @IsString()
  imageFile?: string;

  /**
   * Optional. The updated type of the post (e.g., "UPDATE", "ANNOUNCEMENT").
   * @example "ANNOUNCEMENT"
   */
  @IsOptional()
  @IsString()
  type?: string;

  /**
   * Optional. The ID of the sub-community this post belongs to.
   * @example "clx0xxxxxxxxx"
   */
  @IsOptional()
  @IsString()
  subCommunityId?: string;
}
