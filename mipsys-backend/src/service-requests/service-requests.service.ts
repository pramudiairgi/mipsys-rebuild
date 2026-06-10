import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { desc, eq, and, like, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import {
  serviceRequests,
  customers,
  products,
  StatusService,
  orderParts,
  spareParts,
} from '../database/schema';
import { DrizzleTx } from '../database/types';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { DiagnoseSrDto } from './dto/diagnose-sr.dto';
import { SaveQuoteDto } from './dto/save-quote.dto';
import { CancelQuoteDto } from './dto/cancel-quote.dto';
import { ApproveQuoteDto } from './dto/approve-quote.dto';
import { StockCommandService } from '../inventory/stock-command.service';
import { OrderPartsService } from '../order-parts/order-parts.service';
import { FinanceService } from '../finance/finance.service';
import { ServiceRequestCustomerResolver } from './services/customer-resolver.service';
import { ServiceRequestProductResolver } from './services/product-resolver.service';
import { ServiceRequestActivityService } from './services/activity.service';
import { ServiceRequestStatsService } from './services/stats.service';
import { ServiceRequestStateMachine } from './services/state-machine.service';
import { SrStatusType } from './sr-state-machine.guard';

@Injectable()
export class ServiceRequestService {
  private readonly logger = new Logger(ServiceRequestService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private stockCommand: StockCommandService,
    private orderPartsService: OrderPartsService,
    private financeService: FinanceService,
    private customerResolver: ServiceRequestCustomerResolver,
    private productResolver: ServiceRequestProductResolver,
    private activityService: ServiceRequestActivityService,
    private statsService: ServiceRequestStatsService,
    private stateMachine: ServiceRequestStateMachine
  ) {}

  async findAll(filters: {
    search?: string;
    page?: number;
    limit?: number;
    status?: string;
  }) {
    try {
      const { search, page = 1, limit = 10, status } = filters;

      const conditions: any[] = [];

      if (search) {
        conditions.push(
          or(
            like(serviceRequests.ticketNumber, `%${search}%`),
            like(customers.name, `%${search}%`),
            like(products.modelName, `%${search}%`),
            like(products.serialNumber, `%${search}%`)
          )
        );
      }

      if (status && status !== 'ALL') {
        conditions.push(eq(serviceRequests.statusService, status as any));
      }

      const offset = (page - 1) * limit;

      const results = await this.db
        .select({
          id: serviceRequests.id,
          ticketNumber: serviceRequests.ticketNumber,
          statusService: serviceRequests.statusService,
          statusSystem: serviceRequests.statusSystem,
          incomingDate: serviceRequests.incomingDate,
          customerName: customers.name,
          customerPhone: customers.phone,
          modelName: products.modelName,
          serialNumber: products.serialNumber,
          serviceType: serviceRequests.serviceType,
        })
        .from(serviceRequests)
        .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
        .leftJoin(products, eq(serviceRequests.productId, products.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(serviceRequests.createdAt))
        .limit(limit)
        .offset(offset);

      return results;
    } catch (error) {
      this.logger.error('[GET_ALL_SR_ERROR]', error);
      throw new InternalServerErrorException('Gagal menarik daftar servis.');
    }
  }

  async findOne(ticketNumber: string) {
    try {
      const result = await this.db
        .select({
          id: serviceRequests.id,
          ticketNumber: serviceRequests.ticketNumber,
          statusService: serviceRequests.statusService,
          problemDescription: serviceRequests.problemDescription,
          incomingDate: serviceRequests.incomingDate,
          customerName: customers.name,
          phone: customers.phone,
          address: customers.address,
          modelName: products.modelName,
          serialNumber: products.serialNumber,
          serviceType: serviceRequests.serviceType,
          serviceFee: serviceRequests.serviceFee,
          partFee: serviceRequests.partFee,
          checkDate: serviceRequests.checkDate,
          spDate: serviceRequests.spDate,
          approveDate: serviceRequests.approveDate,
          readyDate: serviceRequests.readyDate,
          closeDate: serviceRequests.closeDate,
          hasInvoice: sql<boolean>`EXISTS(SELECT 1 FROM invoices WHERE invoices.ticket_number = service_requests.ticket_number)`,
        })
        .from(serviceRequests)
        .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
        .leftJoin(products, eq(serviceRequests.productId, products.id))
        .where(eq(serviceRequests.ticketNumber, ticketNumber))
        .limit(1);

      if (!result.length) {
        throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);
      }

      return result[0];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown Error';
      this.logger.error(`[LOG_SYSTEM][ERROR][SR_DETAIL]: ${errorMessage}`);

      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Terjadi kesalahan pada server.');
    }
  }

  async getActivities() {
    return this.activityService.getActivities();
  }

  async getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  async createEntry(dto: CreateServiceRequestDto, adminId: number) {
    return await this.db.transaction(async (tx) => {
      try {
        const targetCustomerId = await this.customerResolver.resolveCustomerId(
          tx,
          dto.customerName,
          dto.address,
          dto.phone,
          dto.customerType
        );

        const targetProductId = await this.productResolver.resolveProductId(
          tx,
          dto.serialNumber,
          dto.modelName
        );

        const [insertResult] = await tx
          .insert(serviceRequests)
          .values({
            ticketNumber: 'TEMP',
            serviceType: dto.serviceType,
            customerId: targetCustomerId,
            productId: targetProductId,
            adminId: adminId,
            problemDescription: dto.problemDescription?.trim(),
            statusService: StatusService.WAITING_CHECK,
            incomingDate: new Date().toISOString().split('T')[0],
          })
          .returning({ id: serviceRequests.id });

        const srId = insertResult.id;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const finalTicket = `SR-${dateStr}-${String(srId).padStart(4, '0')}`;

        await tx
          .update(serviceRequests)
          .set({ ticketNumber: finalTicket })
          .where(eq(serviceRequests.id, srId));

        return { success: true, ticketNumber: finalTicket };
      } catch (error) {
        this.logger.error('[CREATE_ENTRY] Error:', error);
        throw new InternalServerErrorException('Gagal membuat tiket service.');
      }
    });
  }

  async updateEntry(ticketNumber: string, dto: CreateServiceRequestDto) {
    return await this.db.transaction(async (tx) => {
      try {
        const existingSR = await tx.query.serviceRequests.findFirst({
          where: eq(serviceRequests.ticketNumber, ticketNumber),
        });
        if (!existingSR)
          throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

        await this.customerResolver.updateCustomer(tx, existingSR.customerId!, {
          name: dto.customerName,
          address: dto.address,
          phone: dto.phone,
          customerType: dto.customerType,
        });

        await this.productResolver.updateProduct(tx, existingSR.productId!, {
          modelName: dto.modelName,
          serialNumber: dto.serialNumber,
        });

        await tx
          .update(serviceRequests)
          .set({
            serviceType: dto.serviceType,
            problemDescription: dto.problemDescription?.trim(),
            updatedAt: new Date(),
          })
          .where(eq(serviceRequests.id, existingSR.id));

        return {
          success: true,
          message: `Update tiket ${ticketNumber} berhasil.`,
        };
      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error('[UPDATE_ENTRY] Error:', { ticketNumber, error });
        throw new InternalServerErrorException('Gagal memperbarui data.');
      }
    });
  }

  async diagnose(ticketNumber: string, dto: DiagnoseSrDto) {
    const result = await this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr)
        throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService === 'DONE' || sr.statusService === 'CANCEL') {
        throw new BadRequestException(
          `Tiket ${ticketNumber} sudah ${sr.statusService} dan tidak dapat diubah.`
        );
      }

      this.stateMachine.validate(
        sr.statusService as SrStatusType,
        dto.newStatus as SrStatusType
      );

      if (dto.problemDescription?.trim()) {
        await tx
          .update(serviceRequests)
          .set({ problemDescription: dto.problemDescription.trim() })
          .where(eq(serviceRequests.ticketNumber, ticketNumber));
      }

      if (dto.parts && dto.parts.length > 0) {
        for (const partDto of dto.parts) {
          await this.orderPartsService.addPart(
            {
              serviceRequestId: sr.id,
              sparePartId: partDto.sparePartId,
              quantity: partDto.quantity,
            },
            tx,
            'PROPOSED'
          );
        }
      }

      const today = new Date().toISOString().split('T')[0];
      await tx
        .update(serviceRequests)
        .set({
          statusService: dto.newStatus,
          ...(dto.newStatus === 'CHECK' && !sr.checkDate
            ? { checkDate: today }
            : {}),
          ...(dto.newStatus === 'WAITING_APPROVE' && !sr.spDate
            ? { spDate: today }
            : {}),
          ...(dto.newStatus === 'SERVICE'
            ? {
                spDate: !sr.spDate ? today : sr.spDate,
                approveDate: !sr.approveDate ? today : sr.approveDate,
              }
            : {}),
          ...(dto.newStatus === 'DONE'
            ? {
                readyDate: today,
                closeDate: today,
              }
            : {}),
        })
        .where(eq(serviceRequests.ticketNumber, ticketNumber));

      await this.activityService.addActivity(
        tx,
        sr.id,
        'DIAGNOSIS_UPDATED',
        `Status → ${dto.newStatus}${dto.parts?.length ? `, ${dto.parts.length} part diusulkan` : ''}`,
        dto.performedBy ?? null
      );

      return {
        success: true,
        ticketNumber,
        newStatus: dto.newStatus,
        partsAdded: dto.parts?.length ?? 0,
      };
    });

    if (result.newStatus === 'DONE') {
      try {
        const invoice =
          await this.financeService.generateFromServiceRequest(ticketNumber);
        (result as any).invoice = invoice;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Auto-billing gagal untuk ${ticketNumber}: ${msg}`);
        (result as any).invoiceWarning =
          `Invoice gagal dibuat: ${msg}. Buat invoice manual dari tombol BUAT INVOICE.`;
      }
    }

    return result;
  }

  async saveQuote(ticketNumber: string, dto: SaveQuoteDto) {
    return this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr)
        throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService !== 'WAITING_APPROVE') {
        throw new BadRequestException(
          `Penawaran hanya bisa dibuat pada status WAITING_APPROVE. Status saat ini: ${sr.statusService}`
        );
      }

      const parts = await tx.query.orderParts.findMany({
        where: and(
          eq(orderParts.serviceRequestId, sr.id),
          eq(orderParts.status, 'PROPOSED')
        ),
      });

      if (parts.length === 0) {
        throw new BadRequestException(
          'Tidak ada part yang diusulkan. Tambahkan part terlebih dahulu.'
        );
      }

      const totalPartFee = parts.reduce((sum, p) => {
        return sum + parseFloat(p.priceAtAction || '0') * p.quantity;
      }, 0);

      await tx
        .update(serviceRequests)
        .set({
          serviceFee: dto.serviceFee.toString(),
          partFee: totalPartFee.toString(),
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.ticketNumber, ticketNumber));

      await this.activityService.addActivity(
        tx,
        sr.id,
        'QUOTE_SAVED',
        `Penawaran tersimpan: Jasa Rp${Number(dto.serviceFee).toLocaleString('id-ID')}, Part Rp${totalPartFee.toLocaleString('id-ID')}`,
        dto.performedBy ?? null
      );

      return {
        success: true,
        ticketNumber,
        partFee: totalPartFee,
        serviceFee: dto.serviceFee,
      };
    });
  }

  async cancelQuote(ticketNumber: string, dto: CancelQuoteDto) {
    return this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr)
        throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService !== 'WAITING_APPROVE') {
        throw new BadRequestException(
          `Pembatalan hanya bisa dilakukan pada status WAITING_APPROVE. Status saat ini: ${sr.statusService}`
        );
      }

      this.stateMachine.validate(
        sr.statusService as SrStatusType,
        'CANCEL' as SrStatusType
      );

      await tx
        .update(serviceRequests)
        .set({
          statusService: 'CANCEL' as any,
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.ticketNumber, ticketNumber));

      await this.activityService.addActivity(
        tx,
        sr.id,
        'QUOTE_REJECTED',
        'Penawaran ditolak pelanggan. Tiket dibatalkan.',
        dto.performedBy ?? null
      );

      return {
        success: true,
        ticketNumber,
        newStatus: 'CANCEL',
      };
    });
  }

  async approveQuote(ticketNumber: string, dto: ApproveQuoteDto) {
    return this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr)
        throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService !== 'WAITING_APPROVE') {
        throw new BadRequestException(
          `Penawaran hanya bisa disetujui pada status WAITING_APPROVE. Status saat ini: ${sr.statusService}`
        );
      }

      const hasQuote =
        parseFloat(sr.serviceFee || '0') > 0 ||
        parseFloat(sr.partFee || '0') > 0;
      if (!hasQuote) {
        throw new BadRequestException(
          'Belum ada penawaran yang disimpan. Simpan penawaran terlebih dahulu.'
        );
      }

      const parts = await tx.query.orderParts.findMany({
        where: and(
          eq(orderParts.serviceRequestId, sr.id),
          eq(orderParts.status, 'PROPOSED')
        ),
      });

      if (parts.length === 0) {
        throw new BadRequestException(
          'Tidak ada part yang diusulkan. Tambahkan part terlebih dahulu.'
        );
      }

      let allInStock = true;
      for (const part of parts) {
        const sparePart = await tx.query.spareParts.findFirst({
          where: eq(spareParts.id, part.sparePartId!),
          columns: { id: true, stock: true, partName: true },
        });

        if (!sparePart || sparePart.stock < part.quantity) {
          allInStock = false;
          await tx
            .update(orderParts)
            .set({ status: 'OUT_OF_STOCK' })
            .where(eq(orderParts.id, part.id));
        }
      }

      let newStatus: string;
      if (allInStock) {
        newStatus = 'SERVICE';
        for (const part of parts) {
          const sparePart = await tx.query.spareParts.findFirst({
            where: eq(spareParts.id, part.sparePartId!),
            columns: { id: true, stock: true },
          });

          if (sparePart) {
            await this.stockCommand.reserveStock(
              sparePart.id,
              part.quantity,
              ticketNumber,
              dto.performedBy ?? 1,
              tx
            );
          }

          await tx
            .update(orderParts)
            .set({ status: 'IN_STOCK' })
            .where(eq(orderParts.id, part.id));
        }
      } else {
        newStatus = 'AWAITING_PARTS';
      }

      this.stateMachine.validate(
        sr.statusService as SrStatusType,
        newStatus as SrStatusType
      );

      const totalPartFee = parts.reduce((sum, p) => {
        return sum + parseFloat(p.priceAtAction || '0') * p.quantity;
      }, 0);

      await tx
        .update(serviceRequests)
        .set({
          statusService: newStatus as any,
          approveDate: new Date().toISOString().split('T')[0],
          ...(allInStock && !sr.spDate
            ? { spDate: new Date().toISOString().split('T')[0] }
            : {}),
        })
        .where(eq(serviceRequests.ticketNumber, ticketNumber));

      await this.activityService.addActivity(
        tx,
        sr.id,
        'QUOTE_APPROVED',
        allInStock
          ? `Penawaran disetujui. ${parts.length} part dipotong dari stok. Status → SERVICE`
          : `Penawaran disetujui. ${parts.length} part, sebagian tidak tersedia. Status → AWAITING_PARTS`,
        dto.performedBy ?? null
      );

      return {
        success: true,
        ticketNumber,
        newStatus,
        allInStock,
        partFee: totalPartFee,
        serviceFee: sr.serviceFee,
        partsProcessed: parts.length,
      };
    });
  }

  async retryAwaitingParts(ticketNumber: string, dto: CancelQuoteDto) {
    return this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr)
        throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService !== 'AWAITING_PARTS') {
        throw new BadRequestException(
          `Cek ulang stok hanya bisa dilakukan pada status AWAITING_PARTS. Status saat ini: ${sr.statusService}`
        );
      }

      const outOfStockParts = await tx.query.orderParts.findMany({
        where: and(
          eq(orderParts.serviceRequestId, sr.id),
          eq(orderParts.status, 'OUT_OF_STOCK')
        ),
      });

      if (outOfStockParts.length === 0) {
        throw new BadRequestException('Tidak ada part yang menunggu stok.');
      }

      let allAvailable = true;
      for (const op of outOfStockParts) {
        const sp = await tx.query.spareParts.findFirst({
          where: eq(spareParts.id, op.sparePartId!),
          columns: { id: true, stock: true, partName: true },
        });
        if (!sp || sp.stock < op.quantity) {
          allAvailable = false;
          break;
        }
      }

      if (!allAvailable) {
        return {
          success: true,
          ticketNumber,
          newStatus: 'AWAITING_PARTS',
          available: false,
          message: 'Stok masih belum mencukupi untuk semua part.',
        };
      }

      for (const op of outOfStockParts) {
        const sp = await tx.query.spareParts.findFirst({
          where: eq(spareParts.id, op.sparePartId!),
          columns: { id: true, stock: true },
        });

        if (sp) {
          await this.stockCommand.reserveStock(
            sp.id,
            op.quantity,
            ticketNumber,
            dto.performedBy ?? 1,
            tx
          );
        }

        await tx
          .update(orderParts)
          .set({ status: 'IN_STOCK' })
          .where(eq(orderParts.id, op.id));
      }

      this.stateMachine.validate(
        sr.statusService as SrStatusType,
        'SERVICE' as SrStatusType
      );

      await tx
        .update(serviceRequests)
        .set({
          statusService: 'SERVICE' as any,
          spDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.id, sr.id));

      await this.activityService.addActivity(
        tx,
        sr.id,
        'SR_STOCK_RETRY',
        `Cek ulang stok: ${outOfStockParts.length} part tersedia. Status → SERVICE`,
        dto.performedBy ?? null
      );

      return {
        success: true,
        ticketNumber,
        newStatus: 'SERVICE',
        available: true,
        partsProcessed: outOfStockParts.length,
      };
    });
  }

  async closeTicket(ticketNumber: string, dto: { performedBy?: number }) {
    return this.db.transaction(async (tx) => {
      const sr = await tx.query.serviceRequests.findFirst({
        where: eq(serviceRequests.ticketNumber, ticketNumber),
      });
      if (!sr)
        throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);

      if (sr.statusService !== 'DONE' && sr.statusService !== 'CANCEL') {
        throw new BadRequestException(
          `Penutupan hanya bisa dilakukan pada status DONE atau CANCEL. Status saat ini: ${sr.statusService}`
        );
      }

      this.stateMachine.validate(
        sr.statusService as SrStatusType,
        'CLOSED' as SrStatusType
      );

      const today = new Date().toISOString().split('T')[0];

      await tx
        .update(serviceRequests)
        .set({
          statusService: 'CLOSED' as any,
          statusSystem: 'CLOSED',
          closeDate: today,
          pickUpDate: today,
          updatedAt: new Date(),
        })
        .where(eq(serviceRequests.id, sr.id));

      await this.activityService.addActivity(
        tx,
        sr.id,
        'SR_CLOSE',
        `Tiket ditutup. Status: ${sr.statusService} → CLOSED`,
        dto.performedBy ?? null
      );

      return { success: true, ticketNumber, newStatus: 'CLOSED' };
    });
  }
}
