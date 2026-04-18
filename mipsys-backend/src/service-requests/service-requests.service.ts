import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { db } from '../db/db';
import { serviceRequests, machines, partRequests } from '../db/schema';
import { eq, or, like, SQL } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  // --- 1. DASHBOARD (QUERY UTAMA) ---
  // Digunakan untuk menampilkan data di tabel utama frontend
  async getAllDashboard(search: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    let whereFilter: SQL | undefined = undefined;

    if (search) {
      const searchTerm = `%${search}%`;
      whereFilter = or(
        like(serviceRequests.customer_name, searchTerm),
        like(serviceRequests.sr_number, searchTerm),
        like(serviceRequests.machine_model, searchTerm),
      );
    }

    return await db
      .select({
        id: serviceRequests.id,
        sr_number: serviceRequests.sr_number,
        customer_name: serviceRequests.customer_name,
        machine_model: serviceRequests.machine_model,
        serial_number: serviceRequests.serial_number,
        service_mode: serviceRequests.service_mode,
        status: serviceRequests.status,
        created_at: serviceRequests.created_at,
        part_cost: serviceRequests.part_cost, // Penting agar Kasir tidak Rp 0
      })
      .from(serviceRequests)
      .where(whereFilter)
      .limit(limit)
      .offset(offset);
  }

  // --- 2. DETAIL (FIX ERROR 404) ---
  // Mendukung pencarian menggunakan UUID (Database) maupun SR Number (User Friendly URL)
  async getDetailById(id: string) {
    const result = await db
      .select()
      .from(serviceRequests)
      .where(
        or(
          eq(serviceRequests.id, id),        // Cari berdasarkan UUID
          eq(serviceRequests.sr_number, id)  // Cari berdasarkan Nomor SR (misal: IDW5...)
        )
      )
      .limit(1);

    if (!result || result.length === 0) {
      throw new NotFoundException(`Data dengan ID/SR ${id} tidak ditemukan`);
    }
    return result[0];
  }

  // --- 3. CREATE ENTRY & MASTER MESIN ---
  async createEntry(dto: any) {
    const id = crypto.randomUUID();
    await this.handleMachineMaster(dto.machine_model);
    await db.insert(serviceRequests).values({ id, ...dto, status: '0' });
    return { success: true, id };
  }

  async handleMachineMaster(modelName: string) {
    const name = modelName || 'UNKNOWN';
    const existing = await db
      .select()
      .from(machines)
      .where(eq(machines.model, name))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(machines).values({ model: name, brand: 'EPSON' });
    }
  }

  // --- 4. IMPORT EXCEL (STABIL) ---
  private parseExcelDate(value: any): Date {
    if (typeof value === 'number') return new Date((value - 25569) * 86400 * 1000);
    if (typeof value === 'string' && value.includes('/')) {
      const [d, m, y] = value.split('/');
      return new Date(`${y}-${m}-${d}`);
    }
    return new Date();
  }

  async importFromExcel(file: Express.Multer.File) {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames.find((n) => n.includes('REPORT')) || workbook.SheetNames[0];
      const rawData: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      let successCount = 0;
      for (const row of rawData) {
        const rawRma = row['RMA']?.toString() || '';
        const srNumber = rawRma.includes(' / ') ? rawRma.split(' / ')[0].trim() : rawRma.trim();

        if (!srNumber) continue;

        const existing = await db
          .select()
          .from(serviceRequests)
          .where(eq(serviceRequests.sr_number, srNumber))
          .limit(1);

        if (existing.length === 0) {
          await this.handleMachineMaster(row['PRODUCT TYPE']);
          await db.insert(serviceRequests).values({
            id: crypto.randomUUID(),
            sr_number: srNumber,
            customer_name: row['CUSTOMER NAME'] || 'Tanpa Nama',
            phone_number: row['PHONE']?.toString() || '-',
            machine_model: row['PRODUCT TYPE'] || 'UNKNOWN',
            serial_number: row['SN']?.toString() || '-',
            problem_desc: row['PROBLEM'] || '-',
            status: '0',
            created_at: this.parseExcelDate(row['INCOMING DATE']),
            address_1: 'EASC SEMARANG',
            address_3: 'Semarang',
            warranty_status: 'Warranty',
            service_mode: 'Carry-In',
            location_id: 1,
          });
          successCount++;
        }
      }
      return { success: true, message: `${successCount} data berhasil disinkronkan.` };
    } catch (err: any) { throw err; }
  }

  // --- 5. UPDATE TEKNISI (DIAGNOSA & SPAREPART) ---
  // Mengubah status dari 'Baru' (0) ke 'Diproses' (1)
  async updateTechDiagnosis(id: string, dto: UpdateTechRequestDto) {
    let totalPartCost = 0;
    if (dto.parts) {
      totalPartCost = dto.parts.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    }

    // Update Tabel Utama
    await db
      .update(serviceRequests)
      .set({
        technician_name: dto.technician_name,
        tech_remarks: dto.tech_remarks,
        part_cost: totalPartCost,
        status: '1',
      })
      .where(eq(serviceRequests.id, id));

    // Insert Rincian Part ke Tabel PartRequests
    if (dto.parts && dto.parts.length > 0) {
      const entries = dto.parts.map((p) => ({
        sr_id: id,
        part_no: p.part_no || '-', // Fallback strip agar DB tidak error jika kosong
        part_name: p.part_name,
        quantity: p.quantity,
        unit_price: p.unit_price,
        line_total: p.unit_price * p.quantity,
      }));
      await db.insert(partRequests).values(entries);
    }
    return { success: true, total_biaya_part: totalPartCost };
  }

  // --- 6. PROSES KASIR (TOTAL & PPN 11%) ---
  // Mengubah status dari 'Diproses' (1) ke 'Selesai' (2)
  async prosesKasir(id: string, dto: any) {
    const data = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, id))
      .limit(1);
    
    if (!data.length) throw new NotFoundException('Data tidak ditemukan');

    const labor = Number(dto.labor_cost) || 0;
    const onsite = Number(dto.onsite_cost) || 0;
    const parts = Number(data[0].part_cost) || 0;

    const subTotal = labor + onsite + parts;
    const tax = Math.round(subTotal * 0.11); // PPN 11%
    const total = subTotal + tax;

    await db
      .update(serviceRequests)
      .set({
        labor_cost: labor,
        onsite_cost: onsite,
        tax_amount: tax,
        total_amount: total,
        status: '2',
        sp_number: `SP${Date.now().toString().slice(-6)}`,
      })
      .where(eq(serviceRequests.id, id));

    return {
      success: true,
      detail: { labor, onsite, parts, tax, total },
    };
  }

  async syncFromLegacy() {
    return { message: 'Fitur scraper nonaktif. Gunakan Import Excel.' };
  }
}