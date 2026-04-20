import * as z from 'zod';

export const serviceRequestSchema = z.object({
  // --- INFORMASI PELANGGAN ---
  customerName: z.string().min(1, 'Nama pelanggan wajib diisi').max(255),
  phone: z.string().min(1, 'Nomor telepon wajib diisi').max(50),
  address: z
    .string()
    .min(1, 'Alamat wajib diisi agar teknisi tahu lokasi unit'),
  customerType: z.string().default('PERSONAL'),

  // --- INFORMASI PERANGKAT ---
  modelName: z.string().min(1, 'Model mesin wajib diisi'),
  serialNumber: z.string().min(1, 'Serial Number wajib diisi'),

  // --- INFORMASI SERVIS ---
  // Perbaikan: z.enum tidak mendukung required_error, gunakan invalid_type_error
  serviceType: z.enum(['WARRANTY', 'NON_WARRANTY'], {
    message: 'Pilih status garansi yang valid (WARRANTY atau NON_WARRANTY)',
  }),

  problemDescription: z
    .string()
    .min(1, 'Keluhan wajib diisi untuk panduan teknisi'),

  // --- INFORMASI BIAYA AWAL (PENTING!) ---
  onsite_cost: z.coerce
    .number({ message: 'Biaya onsite harus berupa angka' })
    .min(0, 'Biaya tidak boleh negatif')
    .default(0),

  other_cost: z.coerce
    .number({ message: 'Biaya lain harus berupa angka' })
    .min(0)
    .default(0),
});

export type SRFormValues = z.infer<typeof serviceRequestSchema>;
