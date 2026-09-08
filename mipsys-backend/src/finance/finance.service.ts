import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, and, desc, sql, like, or, isNull, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import {
  invoices,
  serviceRequests,
  paymentHistories,
  financeSettings,
  customers,
} from '../database/schema';
import { invoiceStatusEnum } from '../database/schema/enums';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { OrderPartsService } from '../order-parts/order-parts.service';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private orderPartsService: OrderPartsService
  ) {}

  async findAll(search?: string, status?: string) {
    const conditions: SQL[] = [];

    if (status) {
      conditions.push(eq(invoices.status, status as InvoiceStatus));
    }
    if (search) {
      const searchCondition = or(
        like(invoices.invoiceNumber, `%${search}%`),
        like(invoices.clientName, `%${search}%`),
        like(invoices.ticketNumber, `%${search}%`)
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const results = await this.db.query.invoices.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(invoices.invoiceDate)],
    });

    return results;
  }

  async findOne(id: number) {
    const invoice = await this.db.query.invoices.findFirst({
      where: eq(invoices.id, id),
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
      where: eq(serviceRequests.ticketNumber, dto.ticketNumber),
    });
    if (!sr)
      throw new NotFoundException(`Tiket ${dto.ticketNumber} tidak ditemukan.`);

    const existingActive = await this.db.query.invoices.findFirst({
      where: and(
        eq(invoices.serviceRequestId, sr.id),
        isNull(invoices.voidedAt)
      ),
    });
    if (existingActive) {
      throw new BadRequestException(
        `Sudah ada invoice untuk tiket ${dto.ticketNumber}.`
      );
    }

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
        serviceFee: dto.serviceFee,
        partFee: dto.partFee,
        ppn: Number(ppn.toFixed(2)),
        ppnRate,
        total: Number(total.toFixed(2)),
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
      where: eq(invoices.id, id),
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
      amount: dto.amount,
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
      .where(eq(invoices.id, id));

    return {
      success: true,
      message: `Pembayaran untuk ${invoice.invoiceNumber} dicatat.`,
    };
  }

  async voidInvoice(id: number) {
    const invoice = await this.db.query.invoices.findFirst({
      where: eq(invoices.id, id),
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
      .where(eq(invoices.id, id));

    return {
      success: true,
      message: `Invoice ${invoice.invoiceNumber} di-void.`,
    };
  }

  async getStats() {
    const allInvoices = await this.db.query.invoices.findMany();

    const totalRevenue = allInvoices
      .filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    const outstanding = allInvoices
      .filter((i) => i.status === 'UNPAID')
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);

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

    const existingActive = await this.db.query.invoices.findFirst({
      where: and(
        eq(invoices.serviceRequestId, sr.id),
        isNull(invoices.voidedAt),
      ),
    });
    if (existingActive)
      throw new BadRequestException(
        `Invoice untuk tiket ${ticketNumber} sudah ada.`
      );

    const partsCost = await this.orderPartsService.getTotalPartsCost(sr.id);
    const serviceFee = sr.serviceFee ?? 0;
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
        serviceFee,
        partFee: partsCost,
        ppn: Number(ppn.toFixed(2)),
        ppnRate,
        total: Number(total.toFixed(2)),
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

  async exportXlsx(id: number): Promise<Buffer> {
    const invoice = await this.findOne(id);

    const serviceFee = parseFloat(invoice.serviceFee || '0');
    const partFee = parseFloat(invoice.partFee || '0');
    const ppn = parseFloat(invoice.ppn || '0');
    const total = parseFloat(invoice.total || '0');
    const ppnRate = parseFloat(invoice.ppnRate || '11');
    const subtotal = serviceFee + partFee;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Invoice', {
      pageSetup: { paperSize: 9, orientation: 'portrait' },
    });

    ws.columns = [
      { width: 6 },
      { width: 35 },
      { width: 10 },
      { width: 18 },
      { width: 18 },
    ];

    const headerFont = { name: 'Calibri', bold: true, size: 18 };
    const subHeaderFont = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF15803D' } };
    const labelFont = { name: 'Calibri', size: 8, color: { argb: 'FF78716C' } };
    const bodyFont = { name: 'Calibri', size: 10 };
    const boldFont = { name: 'Calibri', bold: true, size: 10 };
    const totalFont = { name: 'Calibri', bold: true, size: 14, color: { argb: 'FF15803D' } };

    let row = 1;

    // Kop Surat
    ws.mergeCells(row, 1, row, 3);
    const companyCell = ws.getCell(row, 1);
    companyCell.value = 'MiPSys';
    companyCell.font = headerFont;
    row++;
    ws.mergeCells(row, 1, row, 3);
    ws.getCell(row, 1).value = 'Jl. Raya Service No. 1';
    ws.getCell(row, 1).font = labelFont;
    row++;
    ws.mergeCells(row, 1, row, 3);
    ws.getCell(row, 1).value = '(021) 1234-5678';
    ws.getCell(row, 1).font = labelFont;
    row++;

    ws.mergeCells(row, 4, row, 5);
    const titleCell = ws.getCell(row, 4);
    titleCell.value = 'INVOICE';
    titleCell.font = subHeaderFont;
    titleCell.alignment = { horizontal: 'right' };
    row++;
    ws.mergeCells(row, 4, row, 5);
    const numCell = ws.getCell(row, 4);
    numCell.value = `No. ${invoice.invoiceNumber}`;
    numCell.font = { name: 'Calibri', size: 8, color: { argb: 'FFA8A29E' } };
    numCell.alignment = { horizontal: 'right' };
    row += 2;

    // Border bawah kop surat
    for (let c = 1; c <= 5; c++) {
      const cell = ws.getRow(row).getCell(c);
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FFD6D3D1' } },
      };
    }
    row += 2;

    // LUNAS stamp
    if (invoice.status === 'PAID') {
      ws.mergeCells(row, 1, row + 1, 5);
      const stampCell = ws.getCell(row, 1);
      stampCell.value = 'LUNAS';
      stampCell.font = { name: 'Calibri', bold: true, size: 36, color: { argb: 'FF15803D' } };
      stampCell.alignment = { horizontal: 'center', vertical: 'middle' };
      row += 3;
    }

    // Info: Kepada (left) + Tanggal/No Tiket (right)
    ws.getCell(row, 1).value = 'KEPADA';
    ws.getCell(row, 1).font = { name: 'Calibri', bold: true, size: 8, color: { argb: 'FFA8A29E' } };
    ws.getCell(row + 1, 1).value = `Yth. ${invoice.clientName}`;
    ws.getCell(row + 1, 1).font = boldFont;
    ws.getCell(row + 2, 1).value = 'di Tempat';
    ws.getCell(row + 2, 1).font = { name: 'Calibri', size: 9, color: { argb: 'FF78716C' } };

    ws.getCell(row, 4).value = 'TANGGAL';
    ws.getCell(row, 4).font = { name: 'Calibri', bold: true, size: 8, color: { argb: 'FFA8A29E' } };
    ws.getCell(row, 4).alignment = { horizontal: 'right' };
    ws.getCell(row + 1, 4).value = new Date(invoice.invoiceDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    ws.getCell(row + 1, 4).font = bodyFont;
    ws.getCell(row + 1, 4).alignment = { horizontal: 'right' };

    ws.getCell(row + 2, 4).value = 'NO. TIKET';
    ws.getCell(row + 2, 4).font = { name: 'Calibri', bold: true, size: 8, color: { argb: 'FFA8A29E' } };
    ws.getCell(row + 2, 4).alignment = { horizontal: 'right' };
    ws.mergeCells(row + 3, 4, row + 3, 5);
    ws.getCell(row + 3, 4).value = invoice.ticketNumber;
    ws.getCell(row + 3, 4).font = boldFont;
    ws.getCell(row + 3, 4).alignment = { horizontal: 'right' };
    row += 5;

    // Pembukaan
    ws.mergeCells(row, 1, row, 5);
    ws.getCell(row, 1).value =
      'Dengan hormat, bersama ini kami sampaikan rincian biaya perbaikan/service untuk unit Bapak/Ibu sebagai berikut:';
    ws.getCell(row, 1).font = { name: 'Calibri', size: 9, color: { argb: 'FF44403C' } };
    ws.getCell(row, 1).alignment = { wrapText: true };
    row += 2;

    // Tabel header
    const tableHeaders = ['No', 'Item Pekerjaan / Sparepart', 'Qty', 'Harga Satuan', 'Jumlah'];
    const tableRow = ws.getRow(row);
    tableHeaders.forEach((h, i) => {
      const cell = tableRow.getCell(i + 1);
      cell.value = h;
      cell.font = { name: 'Calibri', bold: true, size: 8, color: { argb: 'FF78716C' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F4' } };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD6D3D1' } },
        bottom: { style: 'thin', color: { argb: 'FFD6D3D1' } },
        left: { style: 'thin', color: { argb: 'FFD6D3D1' } },
        right: { style: 'thin', color: { argb: 'FFD6D3D1' } },
      };
      cell.alignment = {
        horizontal: i === 0 || i === 2 ? 'center' : i >= 3 ? 'right' : 'left',
        vertical: 'middle',
      };
    });
    row++;

    // Tabel body — per-item real via orderParts (menu aksi invoice only)
    let tableData: Array<{ no: number; item: string; qty: number | string; price: number; jumlah: number }> = [];
    if (invoice.serviceRequestId) {
      try {
        const orderParts = await this.orderPartsService.getByServiceRequest(invoice.serviceRequestId);
        const activeParts = orderParts.filter((p) => p.status !== 'CANCELLED');
        if (activeParts.length > 0) {
          let idx = 1;
          if (serviceFee > 0) {
            tableData.push({ no: idx++, item: 'Biaya Jasa (Service Fee)', qty: 1, price: serviceFee, jumlah: serviceFee });
          }
          activeParts.forEach((p) => {
            const price = parseFloat(p.priceAtAction || '0');
            const qty = p.quantity || 0;
            tableData.push({ no: idx++, item: p.partName, qty, price, jumlah: price * qty });
          });
        } else {
          tableData = [
            { no: 1, item: 'Biaya Jasa (Service Fee)', qty: 1, price: serviceFee, jumlah: serviceFee },
            ...(partFee > 0
              ? [{ no: serviceFee > 0 ? 2 : 1, item: 'Biaya Sparepart', qty: 1 as string | number, price: partFee, jumlah: partFee }]
              : []),
          ];
        }
      } catch {
        tableData = [
          { no: 1, item: 'Biaya Jasa (Service Fee)', qty: 1, price: serviceFee, jumlah: serviceFee },
          ...(partFee > 0
            ? [{ no: serviceFee > 0 ? 2 : 1, item: 'Biaya Sparepart', qty: 1 as string | number, price: partFee, jumlah: partFee }]
            : []),
        ];
      }
    } else {
      tableData = [
        { no: 1, item: 'Biaya Jasa (Service Fee)', qty: 1, price: serviceFee, jumlah: serviceFee },
        ...(partFee > 0
          ? [{ no: serviceFee > 0 ? 2 : 1, item: 'Biaya Sparepart', qty: 1 as string | number, price: partFee, jumlah: partFee }]
          : []),
      ];
    }

    tableData.forEach((d) => {
      const r = ws.getRow(row);
      r.getCell(1).value = d.no;
      r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(1).font = { name: 'Calibri', size: 10, color: { argb: 'FF78716C' } };
      r.getCell(2).value = d.item;
      r.getCell(2).font = boldFont;
      r.getCell(3).value = d.qty;
      r.getCell(3).alignment = { horizontal: 'center' };
      r.getCell(3).font = bodyFont;
      r.getCell(4).value = d.price;
      r.getCell(4).numFmt = '#,##0';
      r.getCell(4).alignment = { horizontal: 'right' };
      r.getCell(4).font = bodyFont;
      r.getCell(5).value = d.jumlah;
      r.getCell(5).numFmt = '#,##0';
      r.getCell(5).alignment = { horizontal: 'right' };
      r.getCell(5).font = boldFont;

      for (let c = 1; c <= 5; c++) {
        r.getCell(c).border = {
          top: { style: 'thin', color: { argb: 'FFD6D3D1' } },
          bottom: { style: 'thin', color: { argb: 'FFD6D3D1' } },
          left: { style: 'thin', color: { argb: 'FFD6D3D1' } },
          right: { style: 'thin', color: { argb: 'FFD6D3D1' } },
        };
      }
      row++;
    });
    row++;

    // Ringkasan Total (right-aligned di kolom 3-5)
    const summaryData = [
      { label: 'Total Biaya Part', value: partFee, bold: false },
      { label: 'Total Biaya Jasa', value: serviceFee, bold: false },
      { label: 'Subtotal', value: subtotal, bold: true },
      { label: `PPN ${ppnRate}%`, value: ppn, bold: false },
    ];

    summaryData.forEach((s) => {
      ws.mergeCells(row, 1, row, 3);
      ws.getCell(row, 1).value = s.label;
      ws.getCell(row, 1).font = s.bold ? boldFont : bodyFont;
      ws.getCell(row, 1).alignment = { horizontal: 'right' };
      ws.mergeCells(row, 4, row, 5);
      ws.getCell(row, 4).value = s.value;
      ws.getCell(row, 4).numFmt = '#,##0';
      ws.getCell(row, 4).font = s.bold ? boldFont : bodyFont;
      ws.getCell(row, 4).alignment = { horizontal: 'right' };

      if (s.label === 'Subtotal') {
        for (let c = 1; c <= 5; c++) {
          ws.getRow(row).getCell(c).border = {
            top: { style: 'thin', color: { argb: 'FFD6D3D1' } },
          };
        }
      }
      row++;
    });

    // Garis ganda sebelum grand total
    for (let c = 1; c <= 5; c++) {
      ws.getRow(row).getCell(c).border = {
        top: { style: 'medium', color: { argb: 'FFD6D3D1' } },
      };
    }
    row++;

    // Grand Total
    ws.mergeCells(row, 1, row, 3);
    ws.getCell(row, 1).value = 'GRAND TOTAL';
    ws.getCell(row, 1).font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF44403C' } };
    ws.getCell(row, 1).alignment = { horizontal: 'right' };
    ws.mergeCells(row, 4, row, 5);
    ws.getCell(row, 4).value = `Rp ${total.toLocaleString('id-ID')}`;
    ws.getCell(row, 4).font = totalFont;
    ws.getCell(row, 4).alignment = { horizontal: 'right' };
    row += 2;

    // Terbilang
    ws.mergeCells(row, 1, row, 5);
    ws.getCell(row, 1).value = `# ${numberToWords(total)}`;
    ws.getCell(row, 1).font = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF78716C' } };
    ws.getCell(row, 1).alignment = { horizontal: 'right' };
    row += 3;

    // Ketentuan & Tanda Tangan
    ws.mergeCells(row, 1, row, 3);
    ws.getCell(row, 1).value = 'KETENTUAN:';
    ws.getCell(row, 1).font = { name: 'Calibri', bold: true, size: 8, color: { argb: 'FFA8A29E' } };
    ws.mergeCells(row, 4, row, 5);
    ws.getCell(row, 4).value = 'HORMAT KAMI,';
    ws.getCell(row, 4).font = { name: 'Calibri', bold: true, size: 8, color: { argb: 'FFA8A29E' } };
    ws.getCell(row, 4).alignment = { horizontal: 'center' };
    row++;

    const paymentLabelXlsx =
      invoice.paymentMethod === 'TRANSFER'
        ? 'Transfer'
        : invoice.paymentMethod === 'QRIS'
          ? 'QRIS'
          : invoice.paymentMethod === 'CASH'
            ? 'Cash'
            : 'CASH/TRANSFER/QRIS';
    const terms = [
      `Pembayaran via metode terpilih (${paymentLabelXlsx}) — harap konfirmasi ke kasir`,
      'Pembayaran dilakukan di kasir sebelum unit diambil',
      'Garansi pekerjaan sesuai ketentuan yang berlaku',
    ];
    terms.forEach((t) => {
      ws.mergeCells(row, 1, row, 3);
      ws.getCell(row, 1).value = `• ${t}`;
      ws.getCell(row, 1).font = { name: 'Calibri', size: 8, color: { argb: 'FF78716C' } };
      row++;
    });

    ws.mergeCells(row + 3, 4, row + 3, 5);
    ws.getCell(row + 3, 4).value = '(________________________)';
    ws.getCell(row + 3, 4).font = boldFont;
    ws.getCell(row + 3, 4).alignment = { horizontal: 'center' };
    ws.mergeCells(row + 4, 4, row + 4, 5);
    ws.getCell(row + 4, 4).value = 'Manajemen MiPSys';
    ws.getCell(row + 4, 4).font = { name: 'Calibri', size: 8, color: { argb: 'FFA8A29E' } };
    ws.getCell(row + 4, 4).alignment = { horizontal: 'center' };

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportPdf(id: number): Promise<Buffer> {
    const invoice = await this.findOne(id);

    const serviceFee = parseFloat(invoice.serviceFee || '0');
    const partFee = parseFloat(invoice.partFee || '0');
    const ppn = parseFloat(invoice.ppn || '0');
    const total = parseFloat(invoice.total || '0');
    const ppnRate = parseFloat(invoice.ppnRate || '11');
    const subtotal = serviceFee + partFee;

    // Tabel per-item real untuk menu aksi invoice (fetch orderParts)
    let pdfTableRows: Array<{ no: string; item: string; qty: string; harga: number; jml: number }> = [];
    if (invoice.serviceRequestId) {
      try {
        const orderParts = await this.orderPartsService.getByServiceRequest(invoice.serviceRequestId);
        const activeParts = orderParts.filter((p) => p.status !== 'CANCELLED');
        if (activeParts.length > 0) {
          let idx = 1;
          if (serviceFee > 0) {
            pdfTableRows.push({ no: String(idx++), item: 'Biaya Jasa (Service Fee)', qty: '1', harga: serviceFee, jml: serviceFee });
          }
          activeParts.forEach((p) => {
            const price = parseFloat(p.priceAtAction || '0');
            const qty = p.quantity || 0;
            pdfTableRows.push({ no: String(idx++), item: p.partName, qty: String(qty), harga: price, jml: price * qty });
          });
        }
      } catch {
        // fallback handled below
      }
    }
    if (pdfTableRows.length === 0) {
      pdfTableRows = [
        { no: '1', item: 'Biaya Jasa (Service Fee)', qty: '1', harga: serviceFee, jml: serviceFee },
        ...(partFee > 0 ? [{ no: serviceFee > 0 ? '2' : '1', item: 'Biaya Sparepart', qty: '1', harga: partFee, jml: partFee }] : []),
      ];
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Kop Surat
      doc.font('Helvetica-Bold').fontSize(24).text('MiPSys', 50, 50);
      doc.font('Helvetica').fontSize(8).fillColor('#78716C');
      doc.text('Jl. Raya Service No. 1', 50, 80);
      doc.text('(021) 1234-5678', 50, 92);

      doc.font('Helvetica-Bold').fontSize(14).fillColor('#15803D');
      doc.text('INVOICE', 370, 50, { align: 'right', width: 175 });
      doc.font('Helvetica').fontSize(8).fillColor('#A8A29E');
      doc.text(`No. ${invoice.invoiceNumber}`, 370, 68, { align: 'right', width: 175 });
      if (invoice.status === 'PAID') {
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#15803D');
        doc.text('LUNAS', 370, 82, { align: 'right', width: 175 });
      }

      // Garis bawah kop
      doc.strokeColor('#D6D3D1').lineWidth(1.5);
      doc.moveTo(50, 105).lineTo(545, 105).stroke();

      // LUNAS stamp — dipindah lurus di bawah nomor invoice (tidak rotate, tidak samar)
      let y = 115;

      // Info: Kepada + Tanggal/Tiket
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#A8A29E');
      doc.text('KEPADA', 50, y);
      doc.text('TANGGAL', 370, y, { align: 'right', width: 175 });
      y += 12;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1C1917');
      doc.text(`Yth. ${invoice.clientName}`, 50, y);
      doc.font('Helvetica').fontSize(10);
      doc.text(
        new Date(invoice.invoiceDate).toLocaleDateString('id-ID', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        370, y, { align: 'right', width: 175 },
      );
      y += 14;
      doc.font('Helvetica').fontSize(8).fillColor('#78716C');
      doc.text('di Tempat', 50, y);
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#A8A29E');
      doc.text('NO. TIKET', 370, y, { align: 'right', width: 175 });
      y += 12;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1C1917');
      doc.text(invoice.ticketNumber, 370, y, { align: 'right', width: 175 });

      // Pembukaan
      y += 35;
      doc.font('Helvetica').fontSize(9).fillColor('#44403C');
      doc.text(
        'Dengan hormat, bersama ini kami sampaikan rincian biaya perbaikan/service untuk unit Bapak/Ibu sebagai berikut:',
        50, y, { width: 495, align: 'justify' },
      );

      // Tabel
      y = doc.y + 15;
      const colNo = 50;
      const colItem = 75;
      const colQty = 295;
      const colHarga = 340;
      const colJml = 450;

      // Header tabel
      doc.rect(50, y, 495, 20).fill('#F5F5F4');
      doc.font('Helvetica-Bold').fontSize(8).fillColor('#78716C');
      doc.text('No', colNo, y + 6, { width: 20, align: 'center' });
      doc.text('Item Pekerjaan / Sparepart', colItem, y + 6, { width: 210 });
      doc.text('Qty', colQty, y + 6, { width: 35, align: 'center' });
      doc.text('Harga Satuan', colHarga, y + 6, { width: 90, align: 'right' });
      doc.text('Jumlah', colJml, y + 6, { width: 90, align: 'right' });
      y += 20;

      // Garis header
      doc.strokeColor('#D6D3D1').lineWidth(0.5);
      doc.moveTo(50, y).lineTo(545, y).stroke();

      // Baris data — pakai pdfTableRows per-item real
      const tableRows = pdfTableRows;

      doc.font('Helvetica').fontSize(10).fillColor('#1C1917');
      tableRows.forEach((r) => {
        doc.font('Helvetica').fontSize(10).fillColor('#78716C');
        doc.text(r.no, colNo, y + 5, { width: 20, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#1C1917');
        doc.text(r.item, colItem, y + 5, { width: 210 });
        doc.font('Helvetica').fontSize(10);
        doc.text(r.qty, colQty, y + 5, { width: 35, align: 'center' });
        doc.text(`Rp ${r.harga.toLocaleString('id-ID')}`, colHarga, y + 5, { width: 90, align: 'right' });
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text(`Rp ${r.jml.toLocaleString('id-ID')}`, colJml, y + 5, { width: 90, align: 'right' });
        y += 25;
        doc.strokeColor('#D6D3D1').lineWidth(0.5);
        doc.moveTo(50, y).lineTo(545, y).stroke();
      });

      // Ringkasan Total
      y += 15;
      const summaryX = 320;
      const summaryVal = 460;

      const summaryItems = [
        { label: 'Total Biaya Part', value: partFee, bold: false },
        { label: 'Total Biaya Jasa', value: serviceFee, bold: false },
        { label: 'Subtotal', value: subtotal, bold: true },
        { label: `PPN ${ppnRate}%`, value: ppn, bold: false },
      ];

      summaryItems.forEach((s) => {
        doc.font(s.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
        doc.fillColor(s.bold ? '#1C1917' : '#78716C');
        doc.text(s.label, summaryX, y, { width: 130 });
        doc.fillColor('#1C1917');
        doc.text(`Rp ${s.value.toLocaleString('id-ID')}`, summaryVal, y, { width: 80, align: 'right' });
        y += 16;
        if (s.label === 'Subtotal') {
          doc.strokeColor('#D6D3D1').lineWidth(0.5);
          doc.moveTo(summaryX, y - 3).lineTo(545, y - 3).stroke();
        }
      });

      // Garis ganda sebelum grand total
      doc.strokeColor('#D6D3D1').lineWidth(1.5);
      doc.moveTo(summaryX, y).lineTo(545, y).stroke();
      y += 5;

      // Grand Total — font diperkecil agar tidak menimpa terbilang
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#1C1917');
      doc.text('GRAND TOTAL', summaryX, y, { width: 130 });
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#15803D');
      doc.text(`Rp ${total.toLocaleString('id-ID')}`, summaryVal, y, { width: 80, align: 'right' });
      y += 20;

      // Terbilang — non-italic, lebih kecil
      doc.font('Helvetica').fontSize(8).fillColor('#78716C');
      doc.text(`# ${numberToWords(total)}`, 50, y, { width: 495, align: 'right' });

      // Garis pemisah
      y += 25;
      doc.strokeColor('#D6D3D1').lineWidth(0.5);
      doc.moveTo(50, y).lineTo(545, y).stroke();
      y += 15;

      // Ketentuan & Tanda Tangan
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#A8A29E');
      doc.text('KETENTUAN:', 50, y);
      doc.text('HORMAT KAMI,', 350, y, { align: 'center', width: 195 });
      y += 15;

      doc.font('Helvetica').fontSize(8).fillColor('#78716C');
      const paymentLabelPdf =
        invoice.paymentMethod === 'TRANSFER'
          ? 'Transfer'
          : invoice.paymentMethod === 'QRIS'
            ? 'QRIS'
            : invoice.paymentMethod === 'CASH'
              ? 'Cash'
              : 'CASH/TRANSFER/QRIS';
      const terms = [
        `Pembayaran via metode terpilih (${paymentLabelPdf}) — harap konfirmasi ke kasir`,
        'Pembayaran dilakukan di kasir sebelum unit diambil',
        'Garansi pekerjaan sesuai ketentuan yang berlaku',
      ];
      terms.forEach((t) => {
        doc.text(`• ${t}`, 50, y, { width: 280 });
        y += 12;
      });

      // Tanda tangan
      y += 50;
      doc.font('Helvetica').fontSize(9).fillColor('#1C1917');
      doc.text('(________________________)', 350, y, { align: 'center', width: 195 });
      y += 14;
      doc.font('Helvetica').fontSize(8).fillColor('#A8A29E');
      doc.text('Manajemen MiPSys', 350, y, { align: 'center', width: 195 });

      // Footer
      y += 30;
      doc.strokeColor('#D6D3D1').lineWidth(0.5);
      doc.moveTo(50, y).lineTo(545, y).stroke();
      y += 10;
      doc.font('Helvetica').fontSize(7).fillColor('#A8A29E');
      doc.text('MiPSys — Jl. Raya Service No. 1 | Telp: (021) 1234-5678', 50, y, { align: 'center', width: 495 });
      y += 10;
      doc.text('Dokumen ini dibuat secara otomatis dan tidak memerlukan tanda tangan basah', 50, y, { align: 'center', width: 495 });

      doc.end();
    });
  }

  private async getPpnRate(): Promise<number> {
    const setting = await this.db.query.financeSettings.findFirst({
      where: eq(financeSettings.key, 'ppn_rate'),
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
      .onConflictDoNothing();

    await this.db
      .update(financeSettings)
      .set({
        value: sql`CAST(CAST(${financeSettings.value} AS INTEGER) + 1 AS TEXT)`,
      })
      .where(eq(financeSettings.key, counterKey));

    const updated = await this.db.query.financeSettings.findFirst({
      where: eq(financeSettings.key, counterKey),
    });
    const counter = updated ? parseInt(updated.value, 10) : 1;

    return `${prefix}-${period}-${String(counter).padStart(4, '0')}`;
  }
}

function numberToWords(num: number): string {
  if (num === 0) return 'Nol Rupiah';
  const units = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];
  const ones = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];
  const tens = [
    '',
    '',
    'Dua Puluh',
    'Tiga Puluh',
    'Empat Puluh',
    'Lima Puluh',
    'Enam Puluh',
    'Tujuh Puluh',
    'Delapan Puluh',
    'Sembilan Puluh',
  ];

  function convertBelowThousand(n: number): string {
    if (n === 0) return '';
    if (n < 12) return ones[n];
    if (n < 20) return ones[n - 10] + ' Belas';
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const rest = n % 10;
      return tens[ten] + (rest ? ' ' + ones[rest] : '');
    }
    if (n < 200) {
      const rest = n - 100;
      return 'Seratus' + (rest ? ' ' + convertBelowThousand(rest) : '');
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const rest = n % 100;
      return ones[hundred] + ' Ratus' + (rest ? ' ' + convertBelowThousand(rest) : '');
    }
    return '';
  }

  function convert(n: number): string {
    if (n < 0) return 'Minus ' + convert(-n);
    if (n < 1000) return convertBelowThousand(n);
    for (let i = 1; i < units.length; i++) {
      const divisor = Math.pow(1000, i);
      if (n < divisor * 1000) {
        const quotient = Math.floor(n / divisor);
        const remainder = n % divisor;
        let prefix: string;
        if (quotient === 1 && i === 1) prefix = 'Se';
        else prefix = convert(quotient) + ' ';
        return prefix + units[i] + (remainder ? ' ' + convert(remainder) : '');
      }
    }
    return '';
  }

  return convert(Math.round(num)).trim().replace(/\s+/g, ' ') + ' Rupiah';
}
