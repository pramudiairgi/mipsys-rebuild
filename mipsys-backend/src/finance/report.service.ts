import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { invoices, expenses } from '../database/schema';
import { invoiceStatusEnum } from '../database/schema/enums';

type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];

@Injectable()
export class ReportService {
  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async getProfitLoss(startDate: string, endDate: string) {
    const revenueData = await this.db.query.invoices.findMany({
      where: and(
        eq(invoices.status, 'PAID' as InvoiceStatus),
        gte(invoices.paidDate, startDate),
        lte(invoices.paidDate, endDate)
      ),
    });
    const totalRevenue = revenueData.reduce(
      (s, i) => s + parseFloat(i.total || '0'),
      0
    );

    const expenseData = await this.db.query.expenses.findMany({
      where: and(
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate)
      ),
    });
    const totalExpenses = expenseData.reduce(
      (s, e) => s + parseFloat(e.amount || '0'),
      0
    );

    return {
      period: { startDate, endDate },
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      revenueCount: revenueData.length,
      expenseCount: expenseData.length,
    };
  }

  async getPpnReport(year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    const paidInvoices = await this.db.query.invoices.findMany({
      where: and(
        eq(invoices.status, 'PAID' as InvoiceStatus),
        gte(invoices.paidDate, startDate),
        lte(invoices.paidDate, endDate)
      ),
    });

    const totalPpn = paidInvoices.reduce(
      (s, i) => s + parseFloat(i.ppn || '0'),
      0
    );
    const totalDpp = paidInvoices.reduce((s, i) => {
      const ppn = parseFloat(i.ppn || '0');
      const total = parseFloat(i.total || '0');
      return s + (total - ppn);
    }, 0);

    return {
      period: `${year}-${String(month).padStart(2, '0')}`,
      totalInvoices: paidInvoices.length,
      totalDpp,
      totalPpn,
      ppnRate: paidInvoices.length > 0 ? paidInvoices[0].ppnRate : '11.00',
    };
  }

  async getDashboard() {
    const now = new Date();
    const monthlyData: {
      label: string;
      revenue: number;
      expense: number;
      profit: number;
    }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
      const label = `${year}-${String(month).padStart(2, '0')}`;

      const monthRevenue = await this.db.query.invoices.findMany({
        where: and(
          eq(invoices.status, 'PAID' as InvoiceStatus),
          gte(invoices.paidDate, startDate),
          lte(invoices.paidDate, endDate)
        ),
      });
      const revenue = monthRevenue.reduce(
        (s, i) => s + parseFloat(i.total || '0'),
        0
      );

      const monthExpenses = await this.db.query.expenses.findMany({
        where: and(
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate)
        ),
      });
      const expense = monthExpenses.reduce(
        (s, e) => s + parseFloat(e.amount || '0'),
        0
      );

      monthlyData.push({ label, revenue, expense, profit: revenue - expense });
    }

    return { monthly: monthlyData };
  }
}
