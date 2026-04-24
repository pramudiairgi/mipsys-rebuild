import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { db } from '../db/db';
import {
  staff,
  customers,
  customerPhones,
  products,
  serviceRequests,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';

// --- 1. Fungsi Utilitas ---

// A. Membaca CSV dengan separator titik koma (;)
function readCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (data: any) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// B. Penerjemah Tanggal (Mengatasi bulan "Agu", "Mei", "Okt" dari Excel)
function parseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const monthStr = parts[1].toLowerCase();
  const year = 2000 + parseInt(parts[2], 10); // Asumsi tahun 20xx

  const monthMap: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    mei: 4,
    jun: 5,
    jul: 6,
    agu: 7,
    sep: 8,
    okt: 9,
    nov: 10,
    des: 11,
  };

  const month = monthMap[monthStr] !== undefined ? monthMap[monthStr] : 0;
  return new Date(year, month, day);
}

async function runSeeder() {
  console.log('🚀 Memulai penarikan data dari Excel ke Database...');
  const filePath = path.join(__dirname, 'data', 'dataset warranty 2026.csv');

  const rawData = await readCSV(filePath);

  // In-Memory Cache
  const staffCache = new Map<string, number>();
  const customerCache = new Map<string, number>();
  const productCache = new Map<string, number>();

  // BUKU CATATAN BOUNCER (Simpan Kunci Unik)
  const processedTickets = new Set<string>();

  for (const row of rawData) {
    // --- A. Ekstrak & Bersihkan Nomor Tiket ---
    let rawTicket = row['RMA'] || row['INC NO'] || row['SR NO'];

    if (
      !rawTicket ||
      typeof rawTicket !== 'string' ||
      rawTicket.trim() === ''
    ) {
      continue; // Skip jika benar-benar kosong
    }

    // Pembersihan Ekstrem: Hapus spasi depan/belakang, ambil sebelum '/'
    let ticketNumber = rawTicket.split('/')[0].trim();

    // --- B. Ekstrak & Bersihkan Serial Number (Untuk Kunci Unik) ---
    let rawSn = row['SN'] || row['SERIAL NUMBER'];
    let sn = rawSn && typeof rawSn === 'string' ? rawSn.trim() : 'UNKNOWN_SN'; // Default jika kosong

    // --- C. BUAT KUNCI UNIK (TICKET + SN) ---
    // Pastikan tidak ada spasi sama sekali di kunci ini agar perbandingan 100% akurat
    const uniqueKey = `${ticketNumber}_${sn}`.replace(/\s+/g, '');

    // LAPIS 1: Cek di Memori (Buku Catatan Bouncer)
    if (processedTickets.has(uniqueKey)) {
      console.log(`⏩ Skip (Duplikat File): ${uniqueKey}`);
      continue;
    }

    // --- D. Ekstrak Product ID (Untuk Lapis 2) ---
    let productId: number | null = null;
    const model =
      row['PRODUCT TYPE']?.trim() || row['TYPE']?.trim() || 'UNKNOWN';

    if (sn !== 'UNKNOWN_SN') {
      if (!productCache.has(sn)) {
        let prod = await db
          .select()
          .from(products)
          .where(eq(products.serialNumber, sn));
        if (prod.length === 0) {
          await db
            .insert(products)
            .values({ serialNumber: sn, modelName: model });
          prod = await db
            .select()
            .from(products)
            .where(eq(products.serialNumber, sn));
        }
        productId = prod[0].id;
        productCache.set(sn, prod[0].id);
      } else {
        productId = productCache.get(sn) ?? null;
      }
    }

    // LAPIS 2: Cek di Database menggunakan Kunci Ganda
    try {
      if (productId) {
        // Gunakan 'and' dari drizzle-orm untuk cek Tiket DAN Product ID
        const existingInDb = await db
          .select()
          .from(serviceRequests)
          .where(
            and(
              eq(serviceRequests.ticketNumber, ticketNumber),
              eq(serviceRequests.productId, productId)
            )
          );

        if (existingInDb.length > 0) {
          console.log(`⏩ Skip (Sudah di DB): ${uniqueKey}`);
          processedTickets.add(uniqueKey); // Masukkan ke catatan agar tidak dicek DB lagi
          continue; // Lompati!
        }
      } else {
        // Jika SN tidak ada, kita hanya bisa cek berdasarkan Ticket Number saja
        const existingInDb = await db
          .select()
          .from(serviceRequests)
          .where(eq(serviceRequests.ticketNumber, ticketNumber));

        if (existingInDb.length > 0) {
          console.log(`⏩ Skip (Tanpa SN, Sudah di DB): ${ticketNumber}`);
          processedTickets.add(uniqueKey);
          continue;
        }
      }
    } catch (error) {
      console.error(
        `Error saat mengecek Lapis 2 untuk tiket ${ticketNumber}:`,
        error
      );
      continue;
    }

    // JIKA LOLOS KEDUA LAPISAN (BUKAN DUPLIKAT), BARU EKSTRAK SISA DATANYA

    // --- E. Ekstrak Staff ---
    const rawAdmin = row['ADMIN']?.trim();
    const adminName = rawAdmin ? rawAdmin.toUpperCase() : null;

    const rawTechCheck =
      row['TECH CHK']?.trim() || row['TECHNICAL CHECK BY']?.trim();
    const techCheckName = rawTechCheck ? rawTechCheck.toUpperCase() : null;

    const rawTechFix =
      row['TECH FIX']?.trim() || row['TECHNICAL FIX BY']?.trim();
    const techFixName = rawTechFix ? rawTechFix.toUpperCase() : null;

    let adminId: number | null = null;
    let techCheckId: number | null = null;
    let techFixId: number | null = null;

    // --- Logika Admin ---
    if (adminName) {
      if (!staffCache.has(adminName)) {
        // Cek dulu ke Database (Jaga-jaga kalau skrip dijalankan ulang)
        let existingStaff = await db
          .select()
          .from(staff)
          .where(eq(staff.name, adminName));

        if (existingStaff.length === 0) {
          await db.insert(staff).values({ name: adminName, role: 'ADMIN' });
          existingStaff = await db
            .select()
            .from(staff)
            .where(eq(staff.name, adminName));
        }
        staffCache.set(adminName, existingStaff[0].id);
      }
      adminId = staffCache.get(adminName) ?? null;
    }

    // --- Logika Tech Check ---
    if (techCheckName) {
      if (!staffCache.has(techCheckName)) {
        let existingStaff = await db
          .select()
          .from(staff)
          .where(eq(staff.name, techCheckName));

        if (existingStaff.length === 0) {
          await db
            .insert(staff)
            .values({ name: techCheckName, role: 'TECHNICIAN' });
          existingStaff = await db
            .select()
            .from(staff)
            .where(eq(staff.name, techCheckName));
        }
        staffCache.set(techCheckName, existingStaff[0].id);
      }
      techCheckId = staffCache.get(techCheckName) ?? null;
    }

    // --- Logika Tech Fix ---
    if (techFixName) {
      if (!staffCache.has(techFixName)) {
        let existingStaff = await db
          .select()
          .from(staff)
          .where(eq(staff.name, techFixName));

        if (existingStaff.length === 0) {
          await db
            .insert(staff)
            .values({ name: techFixName, role: 'TECHNICIAN' });
          existingStaff = await db
            .select()
            .from(staff)
            .where(eq(staff.name, techFixName));
        }
        staffCache.set(techFixName, existingStaff[0].id);
      }
      techFixId = staffCache.get(techFixName) ?? null;
    }

    // --- F. Ekstrak Customer & Phones ---
    const customerName =
      row['CUSTOMER NAME']?.trim() || row['CUSTOMER ']?.trim();
    const rawPhone = row['PHONE']?.trim();

    let customerId: number | null = null;

    if (customerName) {
      if (!customerCache.has(customerName)) {
        await db.insert(customers).values({
          name: customerName,
          address: row['ADDRESS']?.trim() || row['ALAMAT']?.trim(),
          customerType: row['CUSTOMER TYPE']?.trim() || 'PERSONAL',
        });
        const res = await db
          .select()
          .from(customers)
          .where(eq(customers.name, customerName));

        customerId = res[0].id;
        customerCache.set(customerName, res[0].id);

        if (rawPhone) {
          const phones = rawPhone
            .split('/')
            .map((p: string) => p.replace(/\D/g, '').trim())
            .filter((p: string) => p.length > 5);
          for (const p of phones) {
            await db
              .insert(customerPhones)
              .values({ customerId: res[0].id, phone: p });
          }
        }
      } else {
        customerId = customerCache.get(customerName) ?? null;
      }
    }

    // --- G. Proses Insert Akhir (PASTI BUKAN DUPLIKAT) ---
    const serviceType = ticketNumber.includes('NWRNT')
      ? 'NON_WARRANTY'
      : 'WARRANTY';

    try {
      await db.insert(serviceRequests).values({
        ticketNumber: ticketNumber,
        serviceType: serviceType,
        customerId: customerId,
        productId: productId,
        adminId: adminId,
        technicianCheckId: techCheckId,
        technicianFixId: techFixId,
        problemDescription:
          row['PROBLEM']?.trim() || row['PROBLEM DESCRIPTION']?.trim(),
        statusService:
          row['SERVICE STATUS']?.trim() || row['STATUS SERVICE']?.trim(),
        statusSystem:
          row['SYSTEM STATUS']?.trim() || row['STATUS SYSTEM']?.trim(),
        incomingDate: parseDate(row['INCOMING DATE']) || new Date(),
        readyDate: parseDate(row['READY DATE']),
        pickUpDate: parseDate(row['PICK UP DATE']),
      });

      // ✅ Wajib! Catat Kunci Unik ini ke buku kecil
      processedTickets.add(uniqueKey);

      console.log(`✅ Berhasil import: ${uniqueKey}`);
    } catch (error) {
      console.log(`⚠️ Gagal insert ${uniqueKey}:`, error);
    }
  }

  console.log('🎉 SELURUH DATA SELESAI DIIMPOR!');
  process.exit(0);
}

runSeeder().catch((err) => {
  console.error('❌ Terjadi kesalahan fatal:', err);
  process.exit(1);
});
