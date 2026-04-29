import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, desc, like, or, SQL, isNotNull, count } from 'drizzle-orm';
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
   * 1. DASHBOARD ANALYTICS (Real-time Stats)
   * Menghitung jumlah tiket berdasarkan status untuk counter di atas dashboard
   */
  async getDashboardStats() {
    const stats = await this.db
      .select({
        status: serviceRequests.statusService,
        count: count(),
      })
      .from(serviceRequests)
      .groupBy(serviceRequests.statusService);

    // Format data agar mudah dibaca frontend
    const result = {
      total: 0,
      waiting: 0,
      service: 0,
      done: 0,
    };

    stats.forEach((s) => {
      const val = Number(s.count);
      result.total += val;
      if (s.status === 'WAITING CHECK') result.waiting += val;
      if (s.status === 'SERVICE') result.service += val;
      if (s.status === 'DONE') result.done += val;
    });

    return result;
  }

  /**
   * 2. LATEST ACTIVITIES
   * Mengambil riwayat update terakhir untuk log di dashboard
   */
  async getLatestActivities() {
    const logs = await this.db
      .select({
        ticketNumber: serviceRequests.ticketNumber,
        statusService: serviceRequests.statusService,
        updatedAt: serviceRequests.updatedAt,
        techName: staff.name,
      })
      .from(serviceRequests)
      .leftJoin(staff, eq(serviceRequests.technicianFixId, staff.id))
      .where(isNotNull(serviceRequests.updatedAt))
      .orderBy(desc(serviceRequests.updatedAt))
      .limit(5);

    return logs.map((log) => ({
      time: log.updatedAt
        ? new Date(log.updatedAt).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : '--:--',
      user: log.techName || 'System',
      task: `Tiket #${log.ticketNumber} diperbarui ke status ${log.statusService}`,
      status: log.statusService,
    }));
  }

  /**
   * 3. DASHBOARD RESEPSIONIS (List Table)
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
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      .where(whereCondition)
      .orderBy(desc(serviceRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: results.length === limit,
      },
    };
  }

  /**
   * 4. DETAIL TIKET
   */
  async getDetailByTicketNumber(ticketNumber: string) {
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
        customerName: customers.name,
        customerAddress: customers.address,
        customerPhone: customerPhones.phone,
        modelName: products.modelName,
        serialNumber: products.serialNumber,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .leftJoin(customerPhones, eq(customers.id, customerPhones.customerId))
      .leftJoin(products, eq(serviceRequests.productId, products.id))
      .where(eq(serviceRequests.ticketNumber, ticketNumber))
      .limit(1);

    if (mainRows.length === 0)
      throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

    const ticket = mainRows[0];

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

    return {
      ...ticket,
      parts: partsRows.map((p) => ({
        sparePartId: p.sparePartId,
        partName: p.savedPartName || p.masterPartName || 'Sparepart',
        quantity: Number(p.quantity),
        unitPrice: Number(p.unitPrice),
      })),
    };
  }

  /**
   * 5. CREATE ENTRY
   */
  async createEntry(dto: CreateServiceRequestDto, adminId: number) {
    return await this.db.transaction(async (tx) => {
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
        await tx
          .insert(customerPhones)
          .values({ customerId, phone: dto.phone || '-' });
      }

      let productId: number;
      const [existingProd] = await tx
        .select()
        .from(products)
        .where(eq(products.serialNumber, dto.serialNumber || ''))
        .limit(1);

      if (existingProd) {
        productId = existingProd.id;
      } else {
        const [{ insertId }] = await tx.insert(products).values({
          serialNumber: dto.serialNumber || 'SN-UNKNOWN',
          modelName: dto.modelName || 'UNKNOWN MODEL',
        });
        productId = insertId;
      }

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const newTicketNumber = `SR-${dateStr}-${randomNum}`;

      await tx.insert(serviceRequests).values({
        ticketNumber: newTicketNumber,
        serviceType: dto.serviceType || 'NON_WARRANTY',
        customerId,
        productId,
        adminId,
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
        message: 'Berhasil tersimpan.',
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
   * 6. UPDATE OLEH TEKNISI (Refactored)
   */
  async updateTechDiagnosis(ticketNumber: string, dto: UpdateTechRequestDto) {
    const existingSR = await this.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.ticketNumber, ticketNumber),
    });

    if (!existingSR) throw new Error(`Ticket ${ticketNumber} tidak ditemukan.`);

    const totalPartFee = (dto.parts || []).reduce(
      (acc, p) => acc + Number(p.quantity) * Number(p.unitPrice),
      0
    );

    return await this.db.transaction(async (tx) => {
      try {
        // --- PROSES UTAMA ---
        await tx
          .update(serviceRequests)
          .set({
            statusService: dto.statusService,
            technicianFixId: dto.technicianFixId,
            remarksHistory: dto.remarksHistory,
            serviceFee: (dto.serviceFee ?? existingSR.serviceFee)?.toString(),
            checkDate: existingSR.checkDate ?? new Date(),
            readyDate:
              dto.statusService === 'DONE' ? new Date() : existingSR.readyDate,
            partFee: totalPartFee.toString(),
            updatedAt: new Date(),
          })
          .where(eq(serviceRequests.id, existingSR.id));

        // --- SYNC SPAREPARTS ---
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

        // --- SYNC HARDWARE CHECK ---
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

        return {
          success: true,
          message: `Update SR-${ticketNumber} berhasil.`,
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
   * 7. PROSES KASIR
   */
  async prosesKasir(ticketNumber: string, dto: InputBiayaDto) {
    await this.db
      .update(serviceRequests)
      .set({
        serviceFee: dto.serviceFee.toString(),
        partFee: dto.partFee.toString(),
        statusSystem: 'CLOSED',
        pickUpDate: new Date(),
        updatedAt: new Date(), // Pastikan muncul di log aktivitas
      })
      .where(eq(serviceRequests.ticketNumber, ticketNumber));

    return {
      success: true,
      message: `Tiket ${ticketNumber} berhasil diproses.`,
    };
  }
}
