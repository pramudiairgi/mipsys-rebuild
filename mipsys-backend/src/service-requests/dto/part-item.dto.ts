import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class PartItemDto {
  @IsString()
  @IsNotEmpty()
  partName!: string;

  @IsInt()
  @IsNotEmpty()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  priceAtAction!: string;

  @IsInt()
  @IsOptional()
  sparePartId?: number;
}
