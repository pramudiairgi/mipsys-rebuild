import { Injectable, Inject } from "@nestjs/common";
import { eq, desc } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";
import { serviceRequests, customers } from "src/db/schema";

@Injectable()
export class ServiceRequestService {
  constructor(
    // Inject Drizzle instance Anda di sini
    @Inject("DB_CONNECTION") private db: MySql2Database<any>,
  ) {}

  /**
   * Mengambil daftar Service Request teroptimasi untuk jaringan lambat.
   * Menggunakan proyeksi kolom spesifik dan menghindari COUNT(*) query.
   */
  async getOptimizedServiceList(page: number = 1, limit: number = 15) {
    // 1. Kalkulasi Offset untuk Paginasi
    const offset = (page - 1) * limit;

    // 2. Eksekusi Query dengan Proyeksi Selektif (Konsep Drive-Thru)
    const results = await this.db
      .select({
        // HANYA pilih kolom yang akan digambar di UI (Tabel/Card)
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        statusSystem: serviceRequests.statusSystem,
        incomingDate: serviceRequests.incomingDate,

        // Join ringan untuk mengambil nama customer, bukan seluruh profil customer
        customerName: customers.name,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .orderBy(desc(serviceRequests.createdAt)) // Selalu tampilkan yang terbaru
      .limit(limit)
      .offset(offset);

    // 3. Logic "Next Page" Pintar tanpa COUNT(*)
    // Jika kita meminta 15 data dan database mengembalikan 15,
    // kemungkinan besar ada halaman selanjutnya.
    const hasNextPage = results.length === limit;

    return {
      data: results,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: hasNextPage,
      },
    };
  }

  /**
   * Mengambil Detail SATU Service Request
   * Dipanggil hanya saat user menekan detail tiket tertentu.
   */
  async getServiceDetail(ticketNumber: string) {
    // Menggunakan Limit(1) untuk memaksa database berhenti mencari setelah menemukan 1 data.
    const result = await this.db
      .select() // Di sini boleh select all karena hanya 1 baris
      .from(serviceRequests)
      .where(eq(serviceRequests.ticketNumber, ticketNumber))
      .limit(1);

    return result[0] || null;
  }
}
