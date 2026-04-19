import { Type } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  ValidateNested,
  IsArray,
} from "class-validator";
import { PartItemDto } from "./part-item.dto"; // <--- Import dari file baru

export class UpdateTechRequestDto {
  @IsInt({ message: "ID Teknisi harus berupa angka (int)" })
  @IsNotEmpty()
  technicianFixId!: number;

  @IsString()
  @IsNotEmpty()
  problemDescription!: string;

  @IsOptional()
  @IsString()
  statusService?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartItemDto) // <--- Sekarang mengambil dari import di atas
  parts?: PartItemDto[];
}
