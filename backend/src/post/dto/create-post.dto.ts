import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePostDto {
  /**
   * The main content of the post.
   * @example "Excited to share my new project!"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: 'Post subject cannot exceed 200 characters.' })
  subject: string;

  /**
   * The main content of the post. Newline characters are preserved.
   * @example "Excited to share my new project!\nThis is a new line."
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'Post content cannot exceed 2000 characters.' })
  content: string;

  /**
   * Optional. The URL of an image associated with the post.
   * This field is typically populated after an image file is uploaded and processed.
   * @example "https://example.com/image.jpg"
   */
  @IsOptional()
  @IsString()
  imageFile?: string;

  /**
   * Optional. The type of the post (e.g., "UPDATE", "ANNOUNCEMENT").
   * @example "UPDATE"
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
