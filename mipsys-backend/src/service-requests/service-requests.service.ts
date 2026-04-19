import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc, like, or, SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import {
  serviceRequests,
  customers,
  products,
  customerPhones,
} from 'src/db/schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { InputBiayaDto } from './dto/input-biaya.dto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';

@Injectable()
export class ServiceRequestService {
  constructor(@Inject('DB_CONNECTION') private db: MySql2Database<any>) {}

  /**
   * 1. DASHBOARD RESEPSIONIS
   * Teroptimasi untuk pencarian cepat dan paginasi
   */
  async getAllDashboard(
    search: string = '',
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit;

    let whereCondition: SQL | undefined = undefined;
    if (search) {
      whereCondition = or(
        like(serviceRequests.ticketNumber, `%${search}%`),
        like(customers.name, `%${search}%`)
      );
    }

    const results = await this.db
      .select({
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        customerName: customers.name,
        customerType: customers.customerType,
        modelName: products.modelName,
        serialNumber: products.serialNumber,
        serviceType: serviceRequests.serviceType,
        statusService: serviceRequests.statusService,
        statusSystem: serviceRequests.statusSystem,
        incomingDate: serviceRequests.incomingDate,
        readyDate: serviceRequests.readyDate,
        pickUpDate: serviceRequests.pickUpDate,
        partFee: serviceRequests.partFee,
        serviceFee: serviceRequests.serviceFee,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(products, eq(serviceRequests.productId, products.id)) // Join ke products agar model & SN terbaca
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
   * 2. DETAIL TIKET (Pencarian menggunakan Ticket Number)
   */
  async getDetailByTicketNumber(ticketNumber: string) {
    const result = await this.db
      .select({
        // Data Utama Tiket
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        serviceType: serviceRequests.serviceType,
        problemDescription: serviceRequests.problemDescription, // Untuk Keluhan
        statusService: serviceRequests.statusService,
        statusSystem: serviceRequests.statusSystem,

        // Data Waktu & Biaya
        incomingDate: serviceRequests.incomingDate,
        readyDate: serviceRequests.readyDate,
        pickUpDate: serviceRequests.pickUpDate,
        partFee: serviceRequests.partFee,
        serviceFee: serviceRequests.serviceFee,
        createdAt: serviceRequests.createdAt,
        updatedAt: serviceRequests.updatedAt,

        // Data Relasi (JOIN) untuk mengisi kekosongan UI Frontend
        customerName: customers.name,
        customerAddress: customers.address,
        customerPhone: customerPhones.phone, // Untuk Kontak
        modelName: products.modelName,
        serialNumber: products.serialNumber,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      // Join ekstra untuk mengambil nomor telepon
      .leftJoin(customerPhones, eq(customers.id, customerPhones.customerId))
      .where(eq(serviceRequests.ticketNumber, ticketNumber))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(
        `Tiket dengan nomor ${ticketNumber} tidak ditemukan`
      );
    }
    return result[0];
  }

  /**
   * 3. CREATE ENTRY (Resepsionis Mendaftarkan Servis Baru)
   */
  async createEntry(dto: CreateServiceRequestDto) {
    // A. Cari atau Buat Customer
    let customerId: number;
    const existingCustomer = await this.db
      .select()
      .from(customers)
      .where(eq(customers.name, dto.customerName || ''))
      .limit(1);

    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
    } else {
      const [{ insertId }] = await this.db.insert(customers).values({
        name: dto.customerName || 'Tanpa Nama',
        address: dto.address,
        customerType: dto.customerType,
      });
      customerId = insertId;

      // Insert nomor HP (Wajib memiliki setidaknya 1 fallback)
      await this.db
        .insert(customerPhones)
        .values({ customerId, phone: dto.phone || '-' });
    }

    // B. Cari atau Buat Product
    let productId: number;
    const existingProduct = await this.db
      .select()
      .from(products)
      .where(eq(products.serialNumber, dto.serialNumber || ''))
      .limit(1);

    if (existingProduct.length > 0) {
      productId = existingProduct[0].id;
    } else {
      const [{ insertId }] = await this.db.insert(products).values({
        serialNumber: dto.serialNumber || 'SN-UNKNOWN',
        modelName: dto.modelName || 'UNKNOWN MODEL',
      });
      productId = insertId;
    }

    // C. Buat Nomor Tiket Otomatis (Format: SR-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newTicketNumber = `SR-${dateStr}-${randomNum}`;

    // D. Insert Service Request Utama
    await this.db.insert(serviceRequests).values({
      ticketNumber: newTicketNumber,
      serviceType: dto.serviceType || 'NON_WARRANTY',
      customerId: customerId,
      productId: productId,
      problemDescription: dto.problemDescription,
      statusService: 'WAITING CHECK',
      statusSystem: 'OPEN',
      incomingDate: new Date(),
    });

    return {
      success: true,
      ticketNumber: newTicketNumber,
      message: 'Tiket berhasil dibuat',
    };
  }

  /**
   * 4. UPDATE OLEH TEKNISI (Diagnosis & Perbaikan)
   */
  async updateTechDiagnosis(ticketNumber: string, dto: UpdateTechRequestDto) {
    // Logika hitung total biaya part dari array DTO
    let totalPartFee = 0;
    if (dto.parts && dto.parts.length > 0) {
      totalPartFee = dto.parts.reduce((total, item) => {
        return total + item.quantity * item.unit_price;
      }, 0);
    }

    await this.db
      .update(serviceRequests)
      .set({
        problemDescription: dto.problemDescription,
        statusService: dto.statusService,
        technicianFixId: dto.technicianFixId,
        partFee: totalPartFee.toString(), // Masukkan kalkulasi part ke database
        readyDate: dto.statusService === 'DONE' ? new Date() : null, // Set Ready Date otomatis jika selesai
      })
      .where(eq(serviceRequests.ticketNumber, ticketNumber));

    return {
      success: true,
      message: `Diagnosis teknisi untuk tiket ${ticketNumber} berhasil disimpan.`,
    };
  }

  /**
   * 5. PROSES KASIR (Nota & Pembayaran)
   */
  async prosesKasir(ticketNumber: string, dto: InputBiayaDto) {
    await this.db
      .update(serviceRequests)
      .set({
        serviceFee: dto.serviceFee.toString(),
        partFee: dto.partFee.toString(), // Kasir bisa menimpa/memastikan total part fee
        statusSystem: 'CLOSED',
        pickUpDate: new Date(), // Barang diambil hari ini
      })
      .where(eq(serviceRequests.ticketNumber, ticketNumber));

    return {
      success: true,
      message: `Pembayaran tiket ${ticketNumber} berhasil diproses.`,
    };
  }
}
