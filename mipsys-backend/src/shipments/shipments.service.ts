// import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import * as crypto from 'crypto';
// import { db } from '../db/db'; // Import koneksi langsung
// import { shipments } from '../db/schema'; // Import tabel
// import { eq } from 'drizzle-orm';

// @Injectable()
// export class ShipmentsService {
//   private readonly logger = new Logger('ShipmentSiphon');

//   constructor() {} // Tidak butuh Repo lagi

//   async findAll() {
//     // Ambil data langsung lewat Drizzle
//     return await db.select().from(shipments);
//   }

//   async syncFromLegacy() {
//     const baseUrl = process.env.LEGACY_BASE_URL ?? '';
//     const loginUrl = `${baseUrl}/defaultvalid.asp`;
//     const lobbyUrl = `${baseUrl}/scmainmenu.asp`;
//     const dataUrl = `${baseUrl}/EASPSHPSTART.asp`;

//     try {
//       this.logger.log('--- [START] Siphoning Logistik Dimulai ---');

//       // 1. Persiapan Data Login
//       const formData = new URLSearchParams();
//       formData.append('varUSERID', process.env.LEGACY_USER ?? '');
//       formData.append('varPASSWORD', process.env.LEGACY_PASS ?? '');
//       formData.append('submit1', 'SignOn');

//       // 2. Proses Authentication (Login)
//       const loginResponse = await axios.post(loginUrl, formData, {
//         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
//         maxRedirects: 0,
//         validateStatus: (status) => status >= 200 && status < 400,
//       });

//       const cookies = loginResponse.headers['set-cookie'];
//       if (!cookies) throw new Error('Session Cookie tidak ditemukan.');

//       // 3. Mengunci Session ke Lokasi Semarang (Lobby)
//       await axios.get(lobbyUrl, { headers: { 'Cookie': cookies.join('; ') } });

//       // 4. Ambil Data HTML Penerimaan Barang
//       const { data: html } = await axios.get(dataUrl, {
//         headers: { 'Cookie': cookies.join('; ') }
//       });

//       const $ = cheerio.load(html);
//       let added = 0;
//       let skipped = 0;

//       const rows = $('tr').toArray();

//       for (const el of rows) {
//         const cols = $(el).find('td');

//         // Pastikan baris memiliki data (Mipsys biasanya > 11 kolom untuk logistik)
//         if (cols.length >= 11) {
//           const statusVal = $(cols[0]).text().trim();
//           const rawDate = $(cols[3]).text().trim();
//           const picklistNo = $(cols[4]).text().trim();

//           // Validasi: Pastikan ini baris data asli, bukan header
//           if (picklistNo && picklistNo !== 'PICKLIST' && rawDate.includes('/')) {

//             // QUERY LANGSUNG: Cek apakah picklist sudah ada
//             const [existing] = await db
//               .select()
//               .from(shipments)
//               .where(eq(shipments.picklist_no, picklistNo))
//               .limit(1);

//             if (!existing) {
//               const [d, m, y] = rawDate.split('/');
//               const mysqlDateStr = `${y}-${m}-${d}`;

//               // INSERT LANGSUNG: Simpan ke MySQL
//               await db.insert(shipments).values({
//                 id: crypto.randomUUID(),
//                 location_id: 1, // EASC Semarang
//                 status: statusVal,
//                 issue_date: mysqlDateStr as any,
//                 picklist_no: picklistNo,
//               });

//               added++;
//               this.logger.log(`[SHIPMENT] New Picklist: ${picklistNo}`);
//             } else {
//               skipped++;
//             }
//           }
//         }
//       }

//       this.logger.log(`--- [FINISH] Ditambah: ${added} | Lewati: ${skipped} ---`);
//       return { success: true, inserted: added, skipped };

//     } catch (error: any) {
//       this.logger.error(`Siphoning Gagal: ${error.message}`);
//       throw new InternalServerErrorException(`Gagal tarik data logistik: ${error.message}`);
//     }
//   }
// }
