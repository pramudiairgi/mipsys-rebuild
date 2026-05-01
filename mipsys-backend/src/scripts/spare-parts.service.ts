import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db/db'; // Pastikan path ke instance drizzle Mas benar
import { spareParts } from '../db/schema';

/**
 * Fungsi untuk memasukkan data master spareparts dari JSON ke MySQL
 * Menggunakan strategi chunking untuk menangani ribuan data.
 */
export async function seedMasterParts() {
  console.log('🚀 Memulai proses seeding data spareparts...');

  try {
    // 1. Tentukan path file hasil penggabungan (master_parts.json)
    const dataPath = path.join(__dirname, 'data', 'master_parts.json');

    if (!fs.existsSync(dataPath)) {
      throw new Error(`File tidak ditemukan di: ${dataPath}`);
    }

    let rawData = fs.readFileSync(dataPath, 'utf-8');

    // 2. PERBAIKAN BUG: Ubah NaN (Python style) menjadi null (JSON style)
    // Tanpa ini, JSON.parse akan error 'Unexpected token N'
    const cleanData = rawData.replace(/: NaN/g, ': null');

    // 3. Parse data menjadi array objek
    const allParts = JSON.parse(cleanData);
    const totalData = allParts.length;
    const chunkSize = 500; // Ukuran rombongan per pengiriman
    let insertedCount = 0;

    console.log(`📦 Terdeteksi ${totalData} item unik. Memulai pengiriman...`);

    // 4. Proses Looping Chunk (Rombongan Truk)
    for (let i = 0; i < totalData; i += chunkSize) {
      const chunk = allParts.slice(i, i + chunkSize);

      // Mapping untuk validasi tipe data akhir sebelum masuk Drizzle
      const cleanChunk = chunk.map((item: any) => ({
        partCode: item.partCode?.toString() || null,
        modelName: item.modelName || 'General',
        block: item.block || null,
        refNo: item.refNo?.toString() || null,
        partName: item.partName || 'UNKNOWN',
        standard: item.standard || null,
        type: item.type || null,
        stock: Number(item.stock) || 0,
        // Kolom price harus string karena di schema adalah decimal
        price: (item.price || '0.00').toString(),
        note: item.note || null,
        ipStatus: item.ipStatus || null,
      }));

      // 5. Eksekusi Batch Insert ke MySQL
      await db.insert(spareParts).values(cleanChunk);

      insertedCount += cleanChunk.length;
      console.log(
        `✅ Progress: ${insertedCount} / ${totalData} item berhasil masuk.`
      );
    }

    console.log('\n✨ SEEDING BERHASIL SEPENUHNYA!');
    console.log(`Total data di database: ${insertedCount} item.`);
  } catch (error) {
    console.error('❌ Gagal saat seeding:', error);
    process.exit(1);
  }
}

// Menjalankan script secara otomatis jika file ini dipanggil langsung
seedMasterParts();
