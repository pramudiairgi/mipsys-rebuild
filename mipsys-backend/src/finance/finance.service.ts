import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and, desc, sql, like, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import {
  invoices,
  serviceRequests,
  paymentHistories,
  financeSettings,
  customers,
} from '../database/schema';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { OrderPartsService } from '../order-parts/order-parts.service';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private orderPartsService: OrderPartsService
  ) {}

  async findAll(search?: string, status?: string) {
    const conditions: any[] = [];

    if (status) {
      conditions.push(eq(invoices.status, status as any));
    }
    if (search) {
      conditions.push(
        or(
          like(invoices.invoiceNumber, `%${search}%`),
          like(invoices.clientName, `%${search}%`),
          like(invoices.ticketNumber, `%${search}%`)
        )
      );
    }

    const results = await this.db.query.invoices.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(invoices.invoiceDate)],
    });

    return results;
  }

  async findOne(id: number) {
    const invoice = await this.db.query.invoices.findFirst({
      where: eq(invoices.id, id) as any,
      with: {
        payments: {
          orderBy: [desc(paymentHistories.paidAt)],
        },
      },
    });
    if (!invoice)
      throw new NotFoundException(`Invoice ID ${id} tidak ditemukan.`);
    return invoice;
  }

  async create(dto: CreateInvoiceDto) {
    const sr = await this.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.ticketNumber, dto.ticketNumber) as any,
    });
    if (!sr)
      throw new NotFoundException(`Tiket ${dto.ticketNumber} tidak ditemukan.`);

    const invoiceNumber = await this.generateInvoiceNumber();
    const ppnRate = await this.getPpnRate();
    const subtotal = dto.serviceFee + dto.partFee;
    const ppn = subtotal * (ppnRate / 100);
    const total = subtotal + ppn;

    const [result] = await this.db
      .insert(invoices)
      .values({
        invoiceNumber,
        ticketNumber: dto.ticketNumber,
        serviceRequestId: sr.id,
        clientName: dto.clientName,
        serviceFee: dto.serviceFee.toString(),
        partFee: dto.partFee.toString(),
        ppn: ppn.toFixed(2),
        ppnRate: ppnRate.toString(),
        total: total.toFixed(2),
        status: 'UNPAID',
        paymentMethod: dto.paymentMethod || null,
        invoiceDate: new Date().toISOString().split('T')[0],
        notes: dto.notes?.trim() ?? null,
      })
      .returning({ id: invoices.id });

    return { success: true, id: result.id, invoiceNumber };
  }

  async recordPayment(id: number, dto: RecordPaymentDto) {
    const invoice = await this.db.query.invoices.findFirst({
      where: eq(invoices.id, id) as any,
    });
    if (!invoice)
      throw new NotFoundException(`Invoice ID ${id} tidak ditemukan.`);
    if (invoice.status === 'PAID') {
      throw new BadRequestException('Invoice sudah lunas.');
    }
    if (invoice.status === 'VOID') {
      throw new BadRequestException('Invoice sudah di-void.');
    }

    await this.db.insert(paymentHistories).values({
      invoiceId: id,
      amount: dto.amount.toString(),
      paymentMethod: dto.paymentMethod,
      paidAt: new Date(),
      referenceNumber: dto.referenceNumber || null,
      notes: dto.notes || null,
    });

    await this.db
      .update(invoices)
      .set({
        status: 'PAID',
        paymentMethod: dto.paymentMethod,
        paidDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id) as any);

    return {
      success: true,
      message: `Pembayaran untuk ${invoice.invoiceNumber} dicatat.`,
    };
  }

  async voidInvoice(id: number) {
    const invoice = await this.db.query.invoices.findFirst({
      where: eq(invoices.id, id) as any,
    });
    if (!invoice)
      throw new NotFoundException(`Invoice ID ${id} tidak ditemukan.`);
    if (invoice.status === 'PAID') {
      throw new BadRequestException(
        'Tidak bisa void invoice yang sudah lunas.'
      );
    }

    await this.db
      .update(invoices)
      .set({ status: 'VOID', voidedAt: new Date(), updatedAt: new Date() })
      .where(eq(invoices.id, id) as any);

    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} di-void.`,
    };
  }

  async getStats() {
    const allInvoices = await this.db.query.invoices.findMany();

    const totalRevenue = allInvoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + parseFloat(i.total || '0'), 0);

    const outstanding = allInvoices
      .filter((i) => i.status === 'UNPAID')
      .reduce((sum, i) => sum + parseFloat(i.total || '0'), 0);

    const paidCount = allInvoices.filter((i) => i.status === 'PAID').length;
    const unpaidCount = allInvoices.filter((i) => i.status === 'UNPAID').length;
    const overdueCount = allInvoices.filter(
      (i) => i.status === 'OVERDUE'
    ).length;
    const voidCount = allInvoices.filter((i) => i.status === 'VOID').length;

    return {
      totalRevenue,
      outstanding,
      paidCount,
      unpaidCount,
      overdueCount,
      voidCount,
      totalInvoices: allInvoices.length,
    };
  }

  async generateFromServiceRequest(ticketNumber: string) {
    const result = await this.db
      .select({
        id: serviceRequests.id,
        ticketNumber: serviceRequests.ticketNumber,
        customerName: customers.name,
        serviceFee: serviceRequests.serviceFee,
        partFee: serviceRequests.partFee,
      })
      .from(serviceRequests)
      .leftJoin(customers, eq(serviceRequests.customerId, customers.id))
      .where(eq(serviceRequests.ticketNumber, ticketNumber))
      .limit(1);

    if (!result.length) {
      throw new NotFoundException(`Tiket ${ticketNumber} tidak ditemukan.`);
    }

    const sr = result[0];

    const existing = await this.db.query.invoices.findFirst({
      where: eq(invoices.ticketNumber, ticketNumber) as any,
    });
    if (existing)
      throw new BadRequestException(
        `Invoice untuk tiket ${ticketNumber} sudah ada.`
      );

    const partsCost = await this.orderPartsService.getTotalPartsCost(sr.id);
    const serviceFee = parseFloat(sr.serviceFee || '0');
    const ppnRate = await this.getPpnRate();

    const subtotal = serviceFee + partsCost;
    const ppn = subtotal * (ppnRate / 100);
    const total = subtotal + ppn;

    const invoiceNumber = await this.generateInvoiceNumber();

    const [invoiceResult] = await this.db
      .insert(invoices)
      .values({
        invoiceNumber,
        ticketNumber,
        serviceRequestId: sr.id,
        clientName: sr.customerName || 'Customer',
        serviceFee: serviceFee.toString(),
        partFee: partsCost.toString(),
        ppn: ppn.toFixed(2),
        ppnRate: ppnRate.toString(),
        total: total.toFixed(2),
        status: 'UNPAID',
        invoiceDate: new Date().toISOString().split('T')[0],
      })
      .returning({ id: invoices.id });

    return {
      success: true,
      id: invoiceResult.id,
      invoiceNumber,
      breakdown: {
        serviceFee,
        partsCost,
        ppn,
        total,
      },
    };
  }

  private async getPpnRate(): Promise<number> {
    const setting = await this.db.query.financeSettings.findFirst({
      where: eq(financeSettings.key, 'ppn_rate') as any,
    });
    return setting ? parseFloat(setting.value) : 11;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const prefix = 'INV';
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const counterKey = `inv_counter_${period}`;

    await this.db
      .insert(financeSettings)
      .values({
        key: counterKey,
        value: '0',
        description: `Invoice counter for ${period}`,
      })
      .onConflictDoUpdate({
        target: financeSettings.key,
        set: { value: sql`EXCLUDED.value` },
      });

    await this.db
      .update(financeSettings)
      .set({
        value: sql`CAST(CAST(${financeSettings.value} AS INTEGER) + 1 AS TEXT)`,
      })
      .where(eq(financeSettings.key, counterKey) as any);

    const updated = await this.db.query.financeSettings.findFirst({
      where: eq(financeSettings.key, counterKey) as any,
    });
    const counter = updated ? parseInt(updated.value, 10) : 1;

    return `${prefix}-${period}-${String(counter).padStart(4, '0')}`;
  }
}
