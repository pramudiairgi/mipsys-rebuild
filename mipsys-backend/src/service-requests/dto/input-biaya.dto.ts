import { IsNumber, Min } from "class-validator";

export class InputBiayaDto {
  // --- Target: Tabel Service Requests ---
  // Drizzle menyimpan tipe decimal sebagai string, tapi dari sisi Frontend (JSON),
  // kasir akan mengirim angka murni. Kita validasi sebagai number di sini.

  @IsNumber({}, { message: "Biaya jasa (serviceFee) harus berupa angka" })
  @Min(0)
  serviceFee!: number; // Sesuai decimal("service_fee")

  @IsNumber({}, { message: "Biaya part (partFee) harus berupa angka" })
  @Min(0)
  partFee!: number; // Sesuai decimal("part_fee")
}
