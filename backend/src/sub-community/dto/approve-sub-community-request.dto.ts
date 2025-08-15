import { IsBoolean, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ApproveSubCommunityRequestDto {
  @IsBoolean()
  @IsNotEmpty()
  approved: boolean;

  @IsString()
  @IsOptional()
  reason?: string; // Reason for rejection, if applicable
}
