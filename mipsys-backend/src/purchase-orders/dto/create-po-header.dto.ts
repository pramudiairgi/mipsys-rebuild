import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePoItemDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sparePartId?: number;

  @ApiPropertyOptional({ example: 'Head Printer Epson L3210' })
  @IsOptional()
  @IsString()
  partName?: string;

  @ApiPropertyOptional({ example: 'Epson L3210' })
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiProperty({ example: 5, description: 'Jumlah' })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 75000, description: 'Harga satuan IDR' })
  @IsNumber({}, { message: 'Harga satuan harus angka' })
  @Min(0)
  @Type(() => Number)
  unitPrice!: number;
}

export class CreatePoHeaderDto {
  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  requestedBy?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoItemDto)
  items!: CreatePoItemDto[];
}
