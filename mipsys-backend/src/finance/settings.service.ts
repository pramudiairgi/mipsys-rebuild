import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { financeSettings } from '../database/schema';

@Injectable()
export class SettingsService {
  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async getAll(): Promise<Record<string, string>> {
    const settings = await this.db.query.financeSettings.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      if (!s.key.startsWith('inv_counter_')) {
        result[s.key] = s.value;
      }
    }
    return result;
  }

  async updatePpnRate(rate: number) {
    await this.upsert('ppn_rate', rate.toString(), 'PPN rate percentage');
    return { success: true, ppnRate: rate };
  }

  async updateInvoicePrefix(prefix: string) {
    await this.upsert('invoice_prefix', prefix, 'Invoice number prefix');
    return { success: true, invoicePrefix: prefix };
  }

  private async upsert(key: string, value: string, description: string) {
    const existing = await this.db.query.financeSettings.findFirst({
      where: eq(financeSettings.key, key),
    });
    if (existing) {
      await this.db
        .update(financeSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(financeSettings.key, key));
    } else {
      await this.db.insert(financeSettings).values({ key, value, description });
    }
  }
}
