import { IsNumber, Min, IsOptional, IsInt } from 'class-validator';

export class SaveQuoteDto {
  @IsNumber()
  @Min(0)
  serviceFee!: number;

  @IsInt()
  @IsOptional()
  performedBy?: number;
}
