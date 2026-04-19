import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsInt,
} from "class-validator";

export class UpdateTechRequestDto {
  // --- Target: Tabel Service Requests ---
  @IsString()
  @IsNotEmpty({
    message: "Deskripsi masalah (problemDescription) wajib diisi oleh teknisi",
  })
  problemDescription!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50) // Sesuai varchar(50)
  statusService?: string;

  @IsInt({ message: "ID Teknisi harus berupa angka (int)" })
  @IsOptional()
  technicianFixId?: number; // Sesuai int("tech_fix_id")
}
