import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { eq, desc, like, or, SQL } from "drizzle-orm";
import { MySql2Database } from "drizzle-orm/mysql2";
import { serviceRequests, customers } from "src/db/schema";
import { CreateServiceRequestDto } from "./dto/create-service-request.dto";
import { InputBiayaDto } from "./dto/input-biaya.dto";
import { UpdateTechRequestDto } from "./dto/update-tech-request.dto";

@Injectable()
export class ServiceRequestService {
  // <-- Catatan: Pastikan namanya sama dengan yang di-inject di Controller
  constructor(@Inject("DB_CONNECTION") private db: MySql2Database<any>) {}

  /**
   * 1. DASHBOARD RESEPSIONIS (Tabel Utama)
   * Teroptimasi untuk jaringan lambat (Low 4G)
   */
  async getAllDashboard(
    search: string = "",
    page: number = 1,
    limit: number = 10,
  ) {
    const offset = (page - 1) * limit;

    // Logika Pencarian (Search)
    let whereCondition: SQL | undefined = undefined;
    if (search) {
      whereCondition = or(
        like(serviceRequests.ticketNumber, `%${search}%`),
        like(customers.name, `%${search}%`),
      );
    }

    const results = await this.db
      .select({
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        statusSystem: serviceRequests.statusSystem,
        statusService: serviceRequests.statusService,
        incomingDate: serviceRequests.incomingDate,
        customerName: customers.name,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .where(whereCondition)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const hasNextPage = results.length === limit;

    return {
      data: results,
      meta: { currentPage: page, itemsPerPage: limit, hasNextPage },
    };
  }

  /**
   * 2. MENGAMBIL DETAIL SATU TIKET
   */
  async getDetailById(ticketNumber: string) {
    const result = await this.db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.ticketNumber, ticketNumber))
      .limit(1);

    if (!result[0]) throw new NotFoundException("Tiket tidak ditemukan");
    return result[0];
  }

  /**
   * 3. ENTRY BARU (Membuat Tiket Baru)
   */
  async createEntry(dto: CreateServiceRequestDto) {
    // TODO: Logika insert Drizzle untuk tabel Customers, Products, dan Service Requests
    // Ini akan mirip dengan logika seeder excel yang kita buat sebelumnya.
    return { message: "Kerangka fungsi Create Entry siap!" };
  }

  /**
   * 4. UPDATE OLEH TEKNISI
   */
  async updateTechDiagnosis(ticketNumber: string, dto: UpdateTechRequestDto) {
    await this.db
      .update(serviceRequests)
      .set({
        problemDescription: dto.problemDescription,
        statusService: dto.statusService,
        // technicianFixId: dto.technicianId // Contoh jika ada
      })
      .where(eq(serviceRequests.ticketNumber, ticketNumber));

    return { message: `Tiket ${ticketNumber} berhasil diupdate oleh teknisi.` };
  }

  /**
   * 5. PROSES KASIR (Input Biaya)
   */
  async prosesKasir(ticketNumber: string, dto: InputBiayaDto) {
    await this.db
      .update(serviceRequests)
      .set({
        serviceFee: dto.serviceFee.toString(), // Drizzle decimal butuh string
        partFee: dto.partFee.toString(),
        statusSystem: "CLOSED",
        pickUpDate: new Date(),
      })
      .where(eq(serviceRequests.ticketNumber, ticketNumber));

    return { message: `Pembayaran tiket ${ticketNumber} berhasil diproses.` };
  }
}
