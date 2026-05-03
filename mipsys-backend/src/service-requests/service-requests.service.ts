import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  eq,
  desc,
  like,
  or,
  SQL,
  isNotNull,
  count,
  sql,
  InferInsertModel,
} from 'drizzle-orm';
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
import { PartItemDto } from './dto/part-item.dto';
import { SparePartsService } from 'src/spare-parts/spare-parts.service';
import { CreateSparePartDto } from 'src/spare-parts/dto/create-spare-part.dto';

@Injectable()
export class ServiceRequestService {
  constructor(
    @Inject('DB_CONNECTION') private db: MySql2Database<typeof schema>,
    private readonly sparePartsService: SparePartsService
  ) {}

  /**
   * 1. DASHBOARD
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
      .leftJoin(staff, eq(serviceRequests.technicianCheckId, staff.id))
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
        technicianCheckId: serviceRequests.technicianCheckId,
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
    // 1. Validasi awal tiket
    const existingSR = await this.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.ticketNumber, ticketNumber),
    });

    if (!existingSR)
      throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

    const totalPartFee = (dto.parts || []).reduce(
      (acc, p) => acc + Number(p.quantity) * Number(p.unitPrice),
      0
    );

    return await this.db.transaction(async (tx) => {
      try {
        // --- PROSES 1: Update tabel utama ---
        await tx
          .update(serviceRequests)
          .set({
            statusService: dto.statusService,
            technicianCheckId: dto.technicianCheckId,
            remarksHistory: dto.remarksHistory,
            serviceFee: (dto.serviceFee ?? existingSR.serviceFee)?.toString(),
            partFee: totalPartFee.toString(),
            updatedAt: new Date(),
          })
          .where(eq(serviceRequests.id, existingSR.id));

        // --- PROSES 2: Sinkronisasi Spareparts ---
        await tx
          .delete(orderParts)
          .where(eq(orderParts.serviceRequestId, existingSR.id));

        if (dto.parts && dto.parts.length > 0) {
          const resolvedOrderParts: InferInsertModel<typeof orderParts>[] = [];

          for (const p of dto.parts) {
            let targetId: number;

            if (p.sparePartId) {
              const [item] = await tx
                .select()
                .from(spareParts)
                .where(eq(spareParts.id, p.sparePartId));

              if (!item)
                throw new BadRequestException(
                  `ID Part ${p.sparePartId} tidak ditemukan.`
                );
              if (item.stock < p.quantity)
                throw new BadRequestException(
                  `Stok '${p.partName}' tidak cukup.`
                );

              await tx
                .update(spareParts)
                .set({
                  stock: sql`${spareParts.stock} - ${p.quantity}`,
                  price: p.unitPrice.toString(),
                })
                .where(eq(spareParts.id, p.sparePartId));

              targetId = p.sparePartId;
            } else {
              if (!p.partCode || !p.modelName) {
                throw new BadRequestException(
                  `Part baru '${p.partName}' wajib mengisi Kode dan Model.`
                );
              }

              const existingPart = await tx.query.spareParts.findFirst({
                where: eq(spareParts.partCode, p.partCode),
              });

              if (existingPart) {
                targetId = existingPart.id;

                await tx
                  .update(spareParts)
                  .set({ price: p.unitPrice.toString() })
                  .where(eq(spareParts.id, existingPart.id));
              } else {
                const [newPart] = await tx
                  .insert(spareParts)
                  .values({
                    partCode: p.partCode,
                    partName: p.partName,
                    modelName: p.modelName,
                    block: p.block || null,
                    refNo: p.refNo || null,
                    price: p.unitPrice.toString(),
                    stock: 0,
                    ipStatus: p.ipStatus || 'Non IP',
                    note: `Input manual via ${ticketNumber}`,
                  })
                  .$returningId();

                targetId = newPart.id;
              }
            }

            resolvedOrderParts.push({
              serviceRequestId: existingSR.id,
              sparePartId: targetId,
              partName: p.partName,
              quantity: p.quantity,
              priceAtAction: p.unitPrice.toString(),
            });
          }

          // Simpan semua riwayat pemakaian ke order_parts
          await tx.insert(orderParts).values(resolvedOrderParts);
        }

        // --- PROSES 3: Hardware Check ---
        if (dto.hardwareCheck) {
          await tx
            .delete(hardwareChecks)
            .where(eq(hardwareChecks.serviceRequestId, existingSR.id));
          await tx.insert(hardwareChecks).values({
            serviceRequestId: existingSR.id,
            ...dto.hardwareCheck,
          });
        }

        return {
          success: true,
          totalBill:
            Number(dto.serviceFee ?? existingSR.serviceFee) + totalPartFee,
        };
      } catch (error: any) {
        if (error instanceof BadRequestException) throw error;
        console.error(`[Error SR-${ticketNumber}]:`, error);
        throw new InternalServerErrorException(
          'Gagal memproses diagnosis teknisi.'
        );
      }
    });
  }

  async addPartsToRequest(serviceRequestId: number, parts: PartItemDto[]) {
    // Gunakan transaksi database agar data konsisten
    return await this.db.transaction(async (tx) => {
      for (const part of parts) {
        // 1. Logika Pengurangan Stok (Jika ada sparePartId)
        if (part.sparePartId) {
          // Kita panggil fungsi sakti yang sudah kita buat sebelumnya
          await this.sparePartsService.reduceStock(
            part.sparePartId,
            part.quantity
          );
        }

        // 2. Logika Pencatatan Penggunaan Barang (Transaction Table)
        await tx.insert(schema.orderParts).values({
          serviceRequestId,
          sparePartId: part.sparePartId,
          partName: part.partName,
          quantity: part.quantity,
          priceAtAction: part.unitPrice,
          status: part.sparePartId ? 'IN_STOCK' : 'MANUAL_NEW',
        });
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
