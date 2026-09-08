import { IsNumber, Min, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProsesKasirDto {
  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  serviceFee!: number;

  @ApiProperty({ example: 250000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  partFee!: number;

  @ApiPropertyOptional({ example: 'CASH' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
