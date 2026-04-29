import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc, like, or, SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../db/schema';
import {
  serviceRequests,
  customers,
  products,
  customerPhones,
  hardwareChecks,
  orderParts,
  spareParts,
  staff,
} from 'src/db/schema';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { InputBiayaDto } from './dto/input-biaya.dto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';

@Injectable()
export class ServiceRequestService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>
  ) {}

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
    // 1. QUERY UTAMA: Ambil data Header, Customer, dan Produk
    const mainRows = await this.db
      .select({
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        serviceType: serviceRequests.serviceType,
        statusService: serviceRequests.statusService,
        statusSystem: serviceRequests.statusSystem,
        problemDescription: serviceRequests.problemDescription,
        remarksHistory: serviceRequests.remarksHistory,
        partFee: serviceRequests.partFee,
        serviceFee: serviceRequests.serviceFee,
        incomingDate: serviceRequests.incomingDate,
        technicianFixId: serviceRequests.technicianFixId,
        // Data Join Customer
        customerName: customers.name,
        customerAddress: customers.address,
        customerPhone: customerPhones.phone,
        // Data Join Produk
        modelName: products.modelName,
        serialNumber: products.serialNumber,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(customerPhones, eq(customers.id, customerPhones.customerId))
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      .where(eq(serviceRequests.ticketNumber, ticketNumber))
      .limit(1);

    if (mainRows.length === 0) {
      throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);
    }

    const ticket = mainRows[0];

    // 2. QUERY RINCIAN: Ambil data Suku Cadang (Terpisah agar aman dari LATERAL error)
    const partsRows = await this.db
      .select({
        id: orderParts.id,
        sparePartId: orderParts.sparePartId,
        savedPartName: orderParts.partName,
        masterPartName: spareParts.partName,
        quantity: orderParts.quantity,
        unitPrice: orderParts.priceAtAction,
      })
      .from(orderParts)
      .leftJoin(spareParts, eq(orderParts.sparePartId, spareParts.id))
      .where(eq(orderParts.serviceRequestId, ticket.id));

    // 3. GABUNGKAN DATA: Format agar sesuai dengan interface Frontend
    return {
      ...ticket,
      // Pastikan field yang diharapkan frontend ada di sini
      parts: partsRows.map((p) => ({
        sparePartId: p.sparePartId,
        partName: p.savedPartName || p.masterPartName || 'Sparepart',
        quantity: Number(p.quantity),
        unitPrice: Number(p.unitPrice),
      })),
    };
  }

  /**
   * 3. CREATE ENTRY (MAKSIMAL: Transaction + Audit Admin + Unique Check)
   */
  async createEntry(dto: CreateServiceRequestDto, adminId: number) {
    // Memulai Transaksi Database
    return await this.db.transaction(async (tx) => {
      // --- A. HANDLING CUSTOMER (Cek Berdasarkan Nama) ---
      let customerId: number;
      const [existingCust] = await tx
        .select()
        .from(customers)
        .where(eq(customers.name, dto.customerName || ''))
        .limit(1);

      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const [{ insertId }] = await tx.insert(customers).values({
          name: dto.customerName || 'Tanpa Nama',
          address: dto.address,
          customerType: dto.customerType || 'PRIBADI',
        });
        customerId = insertId;

        // Simpan nomor HP untuk customer baru
        await tx.insert(customerPhones).values({
          customerId,
          phone: dto.phone || '-',
        });
      }

      // --- B. HANDLING PRODUCT (Cek Berdasarkan Serial Number) ---
      let productId: number;
      const [existingProd] = await tx
        .select()
        .from(products)
        .where(eq(products.serialNumber, dto.serialNumber || ''))
        .limit(1);

      if (existingProd) {
        productId = existingProd.id; // Gunakan produk yang sudah terdaftar
      } else {
        const [{ insertId }] = await tx.insert(products).values({
          serialNumber: dto.serialNumber || 'SN-UNKNOWN',
          modelName: dto.modelName || 'UNKNOWN MODEL',
        });
        productId = insertId;
      }

      // --- C. GENERATE TICKET NUMBER ---
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const newTicketNumber = `SR-${dateStr}-${randomNum}`;

      // --- D. INSERT SERVICE REQUEST (DENGAN ADMIN ID) ---
      await tx.insert(serviceRequests).values({
        ticketNumber: newTicketNumber,
        serviceType: dto.serviceType || 'NON_WARRANTY',
        customerId: customerId,
        productId: productId,
        adminId: adminId,
        problemDescription: dto.problemDescription,
        statusService: 'WAITING CHECK',
        statusSystem: 'OPEN',
        serviceFee: dto.serviceFee ? dto.serviceFee.toString() : '0',
        partFee: '0',
        incomingDate: new Date(),
      });

      return {
        success: true,
        ticketNumber: newTicketNumber,
        message: 'Data lengkap berhasil tersimpan di sistem.',
      };
    });
  }

  async findAllTechnicians() {
    return await this.db
      .select()
      .from(staff)
      .where(eq(staff.role, 'TECHNICIAN'));
  }

  /**
   * 4. UPDATE OLEH TEKNISI (Diagnosis & Perbaikan)
   */
  async updateTechDiagnosis(ticketNumber: string, dto: UpdateTechRequestDto) {
    const existingSR = await this.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.ticketNumber, ticketNumber),
    });

    if (!existingSR) {
      throw new Error(`Ticket ${ticketNumber} tidak ditemukan.`);
    }

    // 2. Kalkulasi Total Biaya Part secara internal untuk partFee
    const totalPartFee = (dto.parts || []).reduce(
      (acc, p) => acc + Number(p.quantity) * Number(p.unitPrice),
      0
    );

    // 3. Eksekusi Database Transaction (Atomic Process)
    return await this.db.transaction(async (tx) => {
      try {
        await tx
          .update(serviceRequests)
          .set({
            statusService: dto.statusService,
            technicianFixId: dto.technicianFixId,
            remarksHistory: dto.remarksHistory,
            serviceFee: (dto.serviceFee ?? existingSR.serviceFee)?.toString(),
            checkDate: existingSR.checkDate ?? new Date(),

            // 2. Jika status berubah jadi DONE, isi readyDate
            readyDate:
              dto.statusService === 'DONE' ? new Date() : existingSR.readyDate,

            partFee: totalPartFee.toString(),
            updatedAt: new Date(),
          })
          .where(eq(serviceRequests.id, existingSR.id));

        await tx
          .delete(orderParts)
          .where(eq(orderParts.serviceRequestId, existingSR.id));

        if (dto.parts && dto.parts.length > 0) {
          const partsToInsert = dto.parts.map((p) => ({
            serviceRequestId: existingSR.id,
            sparePartId: p.sparePartId || null,
            partName: p.partName,
            quantity: p.quantity,
            priceAtAction: p.unitPrice.toString(),
          }));
          await tx.insert(orderParts).values(partsToInsert);
        }

        // STEP B: Sync Hardware Checks (PH, MB, PS)
        if (dto.hardwareCheck) {
          await tx
            .delete(hardwareChecks)
            .where(eq(hardwareChecks.serviceRequestId, existingSR.id));

          await tx.insert(hardwareChecks).values({
            serviceRequestId: existingSR.id,
            phStatus: dto.hardwareCheck.phStatus,
            mbStatus: dto.hardwareCheck.mbStatus,
            psStatus: dto.hardwareCheck.psStatus,
            othersStatus: dto.hardwareCheck.othersStatus || '',
          });
        }

        await tx
          .update(serviceRequests)
          .set({
            remarksHistory: dto.remarksHistory,
            statusService: dto.statusService,
            technicianFixId: dto.technicianFixId,
            updatedAt: new Date(),
          })
          .where(eq(serviceRequests.id, existingSR.id));

        return {
          success: true,
          message: `Diagnosis SR-${ticketNumber} berhasil disinkronkan.`,
          totalBill:
            Number(dto.serviceFee ?? existingSR.serviceFee) + totalPartFee,
        };
      } catch (error) {
        console.error('Transaction Error:', error);
        throw error;
      }
    });
  }

  /**
   * 5. PROSES KASIR (Nota & Pembayaran)
   */
  async prosesKasir(ticketNumber: string, dto: InputBiayaDto) {
    await this.db
      .update(serviceRequests)
      .set({
        serviceFee: dto.serviceFee.toString(),
        partFee: dto.partFee.toString(),
        statusSystem: 'CLOSED',
        pickUpDate: new Date(),
      })
      .where(eq(serviceRequests.ticketNumber, ticketNumber));

    return {
      success: true,
      message: `Pembayaran tiket ${ticketNumber} berhasil diproses.`,
    };
  }
}
