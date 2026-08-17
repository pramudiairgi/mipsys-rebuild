import { IsInt, IsOptional } from 'class-validator';

export class CancelQuoteDto {
  @IsInt()
  @IsOptional()
  performedBy?: number;
}
