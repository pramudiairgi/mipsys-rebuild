import { IsInt, IsOptional } from 'class-validator';

export class ApproveQuoteDto {
  @IsInt()
  @IsOptional()
  performedBy?: number;
}
