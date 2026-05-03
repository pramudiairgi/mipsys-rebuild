import * as z from 'zod';

// ==========================================
// 1. SCHEMA UNTUK ENTRY (INPUT AWAL)
// ==========================================
export const serviceRequestSchema = z.object({
  customerName: z.string().min(1, 'Nama pelanggan wajib diisi'),
  phone: z.string().min(1, 'Nomor telepon wajib diisi'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  modelName: z.string().min(1, 'Model mesin wajib diisi'),
  serialNumber: z.string().min(1, 'Serial Number wajib diisi'),
  serviceType: z.enum(['WARRANTY', 'NON_WARRANTY']),
  problemDescription: z.string().min(1, 'Keluhan wajib diisi'),
  serviceFee: z.coerce.number().default(0),
});

// ==========================================
// 2. SCHEMA UNTUK PART ITEM (AUTO-REGISTRATION)
// ==========================================
export const partItemSchema = z
  .object({
    sparePartId: z.number().nullable().optional(), // Null memicu Auto-Registration
    partName: z.string().min(1, 'Nama barang wajib diisi'),
    quantity: z.coerce.number().min(1, 'Minimal 1 unit'),
    unitPrice: z.coerce.string().min(1, 'Harga wajib diisi'),

    // Data Master (image_6c8256.jpg)
    partCode: z.string().optional(),
    modelName: z.string().optional(),
    block: z.string().optional(),
    ipStatus: z.enum(['IP', 'Non IP']).default('Non IP'),
  })
  .superRefine((data, ctx) => {
    // LOGIKA KRUSIAL: Jika barang baru, Code & Model wajib ada
    if (!data.sparePartId) {
      if (!data.partCode?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Part Code wajib untuk barang baru',
          path: ['partCode'],
        });
      }
      if (!data.modelName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Model Name wajib untuk barang baru',
          path: ['modelName'],
        });
      }
    }
  });

// ==========================================
// 3. SCHEMA UNTUK UPDATE DIAGNOSIS
// ==========================================
export const updateDiagnosisSchema = z.object({
  technicianCheckId: z.number().min(1, 'Pilih teknisi'),
  remarksHistory: z.string().min(5, 'Berikan diagnosa yang jelas'),
  statusService: z.string(),
  serviceFee: z.coerce.number().default(0),
  parts: z.array(partItemSchema).default([]),
  hardwareCheck: z
    .object({
      phStatus: z.string().default('GOOD'),
      mbStatus: z.string().default('GOOD'),
      psStatus: z.string().default('GOOD'),
      othersStatus: z.string().optional(),
    })
    .nullable(),
});

export type SRFormValues = z.infer<typeof serviceRequestSchema>;
export type UpdateDiagnosisValues = z.infer<typeof updateDiagnosisSchema>;
