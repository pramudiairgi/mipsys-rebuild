import * as z from 'zod';

export const serviceRequestSchema = z.object({
  // --- IDENTITAS (Wajib di Drizzle) ---
  customerName: z.string().min(1, 'Nama pelanggan wajib diisi').max(255),
  phone: z.string().min(1, 'Nomor telepon wajib diisi').max(20),
  address: z.string().min(1, 'Alamat utama wajib diisi').max(255),
  address_3: z.string().min(1, 'Kecamatan/Kota wajib diisi').max(255),
  modelName: z.string().min(1, 'Model mesin wajib diisi').max(100),
  problemDescription: z.string().min(1, 'Deskripsi masalah wajib diisi'),
  serviceType: z.string().min(1, 'Status garansi wajib diisi'),
  service_mode: z.string().min(1, 'Mode servis wajib diisi'),

  // --- OPSIONAL & DEFAULT (Boleh Kosong di Form) ---
  sr_number: z.string().optional(), // Biasanya digenerate backend
  sp_number: z.string().optional(),
  email: z.string().email('Format email salah').optional().or(z.literal('')),
  contact_person: z.string().optional(),
  address_2: z.string().optional(),
  serialNumber: z.string().optional(),
  ink_type: z.string().optional(),
  accessories: z.string().optional(),

  // --- DATA FINANSIAL (Gunakan Coerce untuk Number) ---
  // Kita tambahkan ini agar sinkron dengan Drizzle int()
  labor_cost: z.coerce.number().default(0),
  part_cost: z.coerce.number().default(0),
  onsite_cost: z.coerce.number().default(0),
  other_cost: z.coerce.number().default(0),

  // --- RELASI & STATUS ---
  location_id: z.coerce.number().optional(),
  status: z.string().default('0'),
});

// Otomatisasi Type untuk Frontend
export type SRFormValues = z.infer<typeof serviceRequestSchema>;
