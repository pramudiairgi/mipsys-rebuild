import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsIn,
} from "class-validator";

export class CreateServiceRequestDto {
  // --- Target: Tabel Customers ---
  @IsString()
  @IsNotEmpty({ message: "Nama pelanggan (customers.name) wajib diisi" })
  @MaxLength(255) // Sesuai varchar(255)
  customerName?: string;

  @IsString()
  @IsOptional()
  address?: string; // Sesuai text("address")

  @IsString()
  @IsOptional()
  @MaxLength(50) // Sesuai varchar(50)
  customerType?: string;

  // --- Target: Tabel Customer Phones ---
  @IsString()
  @IsNotEmpty({ message: "Nomor telepon (customer_phones.phone) wajib diisi" })
  @MaxLength(50) // Sesuai varchar(50)
  phone?: string;

  // --- Target: Tabel Products ---
  @IsString()
  @IsNotEmpty({ message: "Model barang (products.modelName) wajib diisi" })
  @MaxLength(100) // Sesuai varchar(100)
  modelName?: string;

  @IsString()
  @IsNotEmpty({ message: "Serial Number (products.serialNumber) wajib diisi" })
  @MaxLength(100) // Sesuai varchar(100)
  serialNumber?: string;

  // --- Target: Tabel Service Requests ---
  @IsNotEmpty()
  @IsIn(["WARRANTY", "NON_WARRANTY"], {
    message: "Tipe servis harus WARRANTY atau NON_WARRANTY",
  })
  serviceType?: "WARRANTY" | "NON_WARRANTY"; // Sesuai mysqlEnum

  @IsString()
  @IsOptional()
  problemDescription?: string; // Sesuai text("problem_description")
}
