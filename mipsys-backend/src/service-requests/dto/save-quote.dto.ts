import { IsNumber, Min, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SaveQuoteDto {
  @ApiProperty({ example: 150000, description: 'Biaya jasa' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  serviceFee!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  performedBy?: number;
}
