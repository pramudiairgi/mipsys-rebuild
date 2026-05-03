import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class PartItemDto {
  @IsInt()
  @IsOptional()
  sparePartId?: number;

  @IsString()
  @IsNotEmpty()
  partName!: string;

  @IsInt()
  @IsNotEmpty()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  unitPrice!: string;

  @IsString()
  @IsOptional()
  partCode?: string;

  @IsString()
  @IsOptional()
  modelName?: string;

  @IsString()
  @IsOptional()
  block?: string;

  @IsString()
  @IsOptional()
  refNo?: string;

  @IsString()
  @IsOptional()
  ipStatus?: string;
}
