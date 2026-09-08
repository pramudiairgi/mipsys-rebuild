import { IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddPoItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  sparePartId!: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 75000, description: 'Harga satuan IDR' })
  @IsNumber({}, { message: 'Harga satuan harus angka' })
  @Min(0)
  @Type(() => Number)
  unitPrice!: number;
}
