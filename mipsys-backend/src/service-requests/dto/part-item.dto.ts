import { IsString, IsNumber, IsNotEmpty, IsOptional } from "class-validator";

export class PartItemDto {
  @IsOptional()
  @IsString()
  part_no?: string;

  @IsString()
  @IsNotEmpty()
  part_name!: string;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsNumber()
  @IsNotEmpty()
  unit_price!: number;
}
