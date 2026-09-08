import { Injectable, Inject } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { financeSettings } from '../database/schema';
import { UpdatePpnConfigDto } from './dto/update-settings.dto';

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

  async getPpnConfig(): Promise<{ ppnRate: number; ppnFormula: string; ppnRounding: string; ppnInclusive: boolean }> {
    const rows = await this.db.query.financeSettings.findMany({
      where: sql`${financeSettings.key} LIKE 'ppn_%'`,
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      ppnRate: map['ppn_rate'] ? parseFloat(map['ppn_rate']) : 11,
      ppnFormula: map['ppn_formula'] || 'EXCLUSIVE',
      ppnRounding: map['ppn_rounding'] || 'HALF_UP',
      ppnInclusive: map['ppn_inclusive'] === 'true',
    };
  }

  async updatePpnConfig(dto: UpdatePpnConfigDto) {
    await this.upsert('ppn_rate', String(dto.ppnRate), 'PPN rate percentage');
    await this.upsert('ppn_formula', dto.ppnFormula || 'EXCLUSIVE', 'PPN formula');
    await this.upsert('ppn_rounding', dto.ppnRounding || 'HALF_UP', 'PPN rounding');
    await this.upsert('ppn_inclusive', String(dto.ppnInclusive ?? false), 'PPN inclusive flag');
    return this.getPpnConfig();
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
