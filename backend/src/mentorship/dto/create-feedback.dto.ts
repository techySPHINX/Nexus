import { IsInt, IsOptional, IsString, IsUUID, Max, Min, IsEnum } from 'class-validator';
import { FeedbackFor } from '@prisma/client';

export class CreateFeedbackDto {
  @IsUUID()
  receiverId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsEnum(FeedbackFor)
  feedbackFor: FeedbackFor;
}
