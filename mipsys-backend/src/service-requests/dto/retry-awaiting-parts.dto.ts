import { IsInt, IsOptional } from 'class-validator';

export class RetryAwaitingPartsDto {
  @IsInt()
  @IsOptional()
  performedBy?: number;
}
