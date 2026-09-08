import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSparePartDto {
  @ApiProperty({ example: 'SP-HD-001', description: 'Kode part' })
  @IsString()
  @IsNotEmpty({ message: 'Part Code wajib diisi' })
  partCode!: string;

  @ApiProperty({ example: 'Head Printer Epson L3210', description: 'Nama sparepart' })
  @IsString()
  @IsNotEmpty({ message: 'Nama sparepart wajib diisi' })
  partName!: string;

  @ApiProperty({ example: 'Epson L3210', description: 'Model mesin' })
  @IsString()
  @IsNotEmpty({ message: 'Model mesin wajib diisi' })
  modelName!: string;

  @ApiPropertyOptional({ example: 'B2', description: 'Blok lokasi' })
  @IsString()
  @IsOptional()
  block?: string;

  @ApiPropertyOptional({ example: 12, description: 'Stok' })
  @IsInt({ message: 'Stok harus berupa angka bulat' })
  @Min(0)
  @IsOptional()
  stock: number = 0;

  @ApiProperty({ example: 150000, description: 'Harga satuan IDR' })
  @IsNumber({}, { message: 'Harga harus berupa angka' })
  @Min(0)
  @Type(() => Number)
  price!: number;
}
