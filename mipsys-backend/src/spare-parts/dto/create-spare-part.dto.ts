import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumberString,
} from 'class-validator';

export class CreateSparePartDto {
  @IsString()
  @IsNotEmpty()
  partCode!: string;

  @IsString()
  @IsNotEmpty()
  partName!: string;

  @IsString()
  @IsNotEmpty()
  modelName!: string;

  @IsString()
  @IsOptional()
  block?: string;

  @IsString()
  @IsOptional()
  refNo?: string;

  @IsInt()
  @IsOptional()
  stock: number = 0;

  @IsNumberString()
  @IsNotEmpty()
  price!: string;

  @IsString()
  @IsOptional()
  ipStatus: string = 'Non IP';

  @IsString()
  @IsOptional()
  note?: string;
}
