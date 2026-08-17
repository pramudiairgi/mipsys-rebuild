import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { poItems } from '../database/schema';

type DrizzleTx = Parameters<
  Parameters<NodePgDatabase<typeof schema>['transaction']>[0]
>[0];

@Injectable()
export class PoItemsService {
  private readonly logger = new Logger(PoItemsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async addItems(
    tx: DrizzleTx,
    purchaseOrderId: number,
    items: {
      sparePartId?: number;
      partName?: string;
      modelName?: string;
      quantity: number;
      unitPrice: number;
    }[]
  ) {
    for (const item of items) {
      const subtotal = item.quantity * item.unitPrice;
      await tx.insert(poItems).values({
        purchaseOrderId,
        sparePartId: item.sparePartId ?? null,
        partName: item.partName ?? null,
        modelName: item.modelName ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        receivedQty: 0,
        subtotal: subtotal.toString(),
      });
    }
  }

  async deleteItemsByPO(tx: DrizzleTx, purchaseOrderId: number) {
    await tx
      .delete(poItems)
      .where(eq(poItems.purchaseOrderId, purchaseOrderId));
  }

  async getItemsByPO(purchaseOrderId: number) {
    return this.db.query.poItems.findMany({
      where: eq(poItems.purchaseOrderId, purchaseOrderId),
    });
  }

  async updateReceivedQty(
    tx: DrizzleTx,
    poItemId: number,
    receivedQty: number
  ) {
    const item = await this.db.query.poItems.findFirst({
      where: eq(poItems.id, poItemId),
    });
    if (!item) return;

    const newTotalReceived = (item.receivedQty || 0) + receivedQty;
    const subtotal = (newTotalReceived * parseFloat(item.unitPrice)).toString();

    await tx
      .update(poItems)
      .set({ receivedQty: newTotalReceived, subtotal })
      .where(eq(poItems.id, poItemId));
  }
}
