import { IsNotEmpty, IsString, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PartItemDto {
  @IsOptional() 
  @IsString() 
  part_no?: string; // Opsional agar tidak error jika dikosongkan

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

export class UpdateTechRequestDto {
  @IsString() 
  @IsNotEmpty() 
  technician_name!: string;

  @IsString() 
  @IsNotEmpty() 
  tech_remarks!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartItemDto)
  parts?: PartItemDto[];
}