import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import {
  spareParts,
  purchaseOrders,
  poItems,
  financeSettings,
} from '../../database/schema';

export interface StockLevelChangedEvent {
  sparePartId: number;
  newStock: number;
}

@Injectable()
export class InventoryListener {
  private readonly logger = new Logger(InventoryListener.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  @OnEvent('stock.level-changed')
  async handleStockLevelChanged(payload: StockLevelChangedEvent) {
    const { sparePartId, newStock } = payload;

    try {
      const part = await this.db.query.spareParts.findFirst({
        where: eq(spareParts.id, sparePartId),
        columns: { id: true, partName: true, minStock: true },
      });

      if (!part || part.minStock === null) return;

      if (newStock >= part.minStock) return;

      const reorderQty = part.minStock * 2;

      const poNumber = await this.generateAutoPoNumber();

      await this.db.transaction(async (tx) => {
        const [poResult] = await tx
          .insert(purchaseOrders)
          .values({
            poNumber,
            supplierName: 'EPSON',
            status: 'REQUESTED',
            requestedBy: 1,
            notes: `Auto-PO: ${part.partName} stok menipis (${newStock} < ${part.minStock})`,
            totalAmount: '0.00',
          })
          .returning({ id: purchaseOrders.id });

        await tx.insert(poItems).values({
          purchaseOrderId: poResult.id,
          sparePartId: part.id,
          quantity: reorderQty,
          unitPrice: '0.00',
          receivedQty: 0,
        });
      });
    } catch (error) {
      this.logger.error(
        `[AUTO_PO] Gagal membuat PO otomatis untuk part #${sparePartId}:`,
        error
      );
    }
  }

  private async generateAutoPoNumber(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const counterKey = `po_counter_${dateStr}`;

    await this.db
      .insert(financeSettings)
      .values({
        key: counterKey,
        value: '0',
        description: `PO counter for ${dateStr}`,
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
      .where(eq(financeSettings.key, counterKey));

    const updated = await this.db.query.financeSettings.findFirst({
      where: eq(financeSettings.key, counterKey) as any,
    });
    const counter = updated ? parseInt(updated.value, 10) : 1;

    return `PO-AUTO-${dateStr}-${String(counter).padStart(4, '0')}`;
  }
}
