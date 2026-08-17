import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { eq, and, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import {
  serviceRequests,
  orderParts,
  spareParts,
  serviceLogs,
} from '../../database/schema';
import { StockMovementsService } from '../../stock-movements/stock-movements.service';

export interface PoReceivedEvent {
  receivedSparePartIds: number[];
  performedBy?: number;
}

@Injectable()
export class ServiceRequestListener {
  private readonly logger = new Logger(ServiceRequestListener.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private stockMovementsService: StockMovementsService
  ) {}

  @OnEvent('purchase-order.received')
  async handlePoReceived(payload: PoReceivedEvent) {
    const { receivedSparePartIds, performedBy } = payload;

    if (receivedSparePartIds.length === 0) return;

    try {
      const awaitingSrs = await this.db.query.serviceRequests.findMany({
        where: eq(serviceRequests.statusService, 'AWAITING_PARTS'),
        columns: { id: true, ticketNumber: true },
      });

      for (const sr of awaitingSrs) {
        await this.tryTransitionSr(
          sr.id,
          sr.ticketNumber,
          receivedSparePartIds,
          performedBy
        );
      }
    } catch (error) {
      this.logger.error('[SR_AUTO_TRANSITION] Gagal memproses SR:', error);
    }
  }

  private async tryTransitionSr(
    srId: number,
    ticketNumber: string,
    receivedSparePartIds: number[],
    performedBy?: number
  ) {
    const srParts = await this.db.query.orderParts.findMany({
      where: and(
        eq(orderParts.serviceRequestId, srId),
        eq(orderParts.status, 'OUT_OF_STOCK'),
        inArray(orderParts.sparePartId, receivedSparePartIds)
      ),
    });

    if (srParts.length === 0) return;

    const allOutOfStockParts = await this.db.query.orderParts.findMany({
      where: and(
        eq(orderParts.serviceRequestId, srId),
        eq(orderParts.status, 'OUT_OF_STOCK')
      ),
    });

    let canTransition = true;
    for (const op of allOutOfStockParts) {
      const sp = await this.db.query.spareParts.findFirst({
        where: eq(spareParts.id, op.sparePartId!),
        columns: { id: true, stock: true, partName: true },
      });
      if (!sp || sp.stock < op.quantity) {
        canTransition = false;
        break;
      }
    }

    if (!canTransition) return;

    await this.db.transaction(async (tx) => {
      for (const op of allOutOfStockParts) {
        const sp = await tx.query.spareParts.findFirst({
          where: eq(spareParts.id, op.sparePartId!),
          columns: { id: true, stock: true },
        });
        if (sp) {
          await this.stockMovementsService.createMovement(
            {
              sparePartId: sp.id,
              quantity: -op.quantity,
              movementType: 'SERVICE_USE',
              referenceType: 'SR_TICKET',
              referenceId: ticketNumber,
              performedBy,
            },
            tx
          );
          await this.stockMovementsService.updateStock(
            tx,
            sp.id,
            -op.quantity,
            'SERVICE_USE'
          );
        }

        await tx
          .update(orderParts)
          .set({ status: 'IN_STOCK' })
          .where(eq(orderParts.id, op.id));
      }

      await tx
        .update(serviceRequests)
        .set({
          statusService: 'SERVICE',
          spDate: new Date().toISOString().split('T')[0],
        })
        .where(eq(serviceRequests.id, srId));

      await tx.insert(serviceLogs).values({
        serviceRequestId: srId,
        action: 'SR_AUTO_TRANSITION',
        description: `Stok tersedia setelah PO diterima. ${allOutOfStockParts.length} part dipotong dari stok. Status → SERVICE`,
        performedBy: performedBy ?? null,
      });
    });
  }
}
