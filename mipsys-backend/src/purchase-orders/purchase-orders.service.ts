import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import {
  purchaseOrders,
  poItems,
  spareParts,
  financeSettings,
} from '../database/schema';
import { CreatePoHeaderDto, CreatePoItemDto } from './dto/create-po-header.dto';
import { ReceivePoDto } from './dto/receive-po.dto';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { PoItemsService } from './po-items.service';
import { validatePoTransition, PoStatusType } from './po-state-machine.guard';

type DrizzleTx = Parameters<
  Parameters<NodePgDatabase<typeof schema>['transaction']>[0]
>[0];

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private stockMovementsService: StockMovementsService,
    private poItemsService: PoItemsService,
    private eventEmitter: EventEmitter2
  ) {}

  validateTransition(current: PoStatusType, next: PoStatusType) {
    validatePoTransition(current, next);
  }

  private async enrichItems(items: any[]) {
    const nullPartIds = items
      .filter((i) => !i.partName && i.sparePartId)
      .map((i) => i.sparePartId);
    if (nullPartIds.length === 0) return items;

    const parts = await this.db.query.spareParts.findMany({
      where: inArray(spareParts.id, nullPartIds),
    });
    const partsMap = new Map(parts.map((p) => [p.id, p]));

    return items.map((item) => {
      if (!item.partName && item.sparePartId) {
        const sp = partsMap.get(item.sparePartId);
        if (sp) {
          return {
            ...item,
            partName: sp.partName,
            modelName: item.modelName || sp.modelName,
          };
        }
      }
      return item;
    });
  }

  async findAll() {
    const orders = await this.db.query.purchaseOrders.findMany({
      orderBy: [desc(purchaseOrders.createdAt)],
    });

    if (orders.length === 0) return [];

    const orderIds = orders.map((o) => o.id);
    let allItems = await this.db.query.poItems.findMany({
      where: inArray(poItems.purchaseOrderId, orderIds),
    });

    allItems = await this.enrichItems(allItems);

    const itemsByPoId: Map<number, typeof allItems> = new Map();
    for (const item of allItems) {
      const key = item.purchaseOrderId;
      if (!itemsByPoId.has(key)) itemsByPoId.set(key, []);
      itemsByPoId.get(key)!.push(item);
    }

    return orders.map((o) => ({
      ...o,
      items: itemsByPoId.get(o.id) ?? [],
    }));
  }

  async findOne(id: number) {
    const po = await this.db.query.purchaseOrders.findFirst({
      where: eq(purchaseOrders.id, id),
    });
    if (!po) throw new NotFoundException(`PO ID ${id} tidak ditemukan.`);

    let items = await this.poItemsService.getItemsByPO(id);
    items = await this.enrichItems(items);
    return { ...po, items };
  }

  private mergeDuplicateItems(items: CreatePoItemDto[]): CreatePoItemDto[] {
    const map = new Map<string, CreatePoItemDto>();
    for (const item of items) {
      const key = item.sparePartId
        ? `sp:${item.sparePartId}`
        : `name:${item.partName ?? ''}|${item.modelName ?? ''}`;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        map.set(key, { ...item });
      }
    }
    return Array.from(map.values());
  }

  async create(dto: CreatePoHeaderDto) {
    dto.items = this.mergeDuplicateItems(dto.items);

    return this.db.transaction(async (tx) => {
      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException('PO harus memiliki minimal 1 item');
      }

      const poNumber = await this.generatePoNumber();
      let totalAmount = 0;

      for (const item of dto.items) {
        totalAmount += item.quantity * item.unitPrice;
      }

      const [poResult] = await tx
        .insert(purchaseOrders)
        .values({
          poNumber,
          supplierName: dto.supplierName || 'EPSON',
          status: 'DRAFT',
          requestedBy: dto.requestedBy,
          notes: dto.notes?.trim() ?? null,
          totalAmount: totalAmount.toString(),
        })
        .returning({ id: purchaseOrders.id });

      await this.poItemsService.addItems(tx, poResult.id, dto.items);

      return { success: true, id: poResult.id, poNumber };
    });
  }

  async update(id: number, dto: CreatePoHeaderDto) {
    dto.items = this.mergeDuplicateItems(dto.items);

    const po = await this.findOne(id);
    const currentStatus = po.status as PoStatusType;
    if (currentStatus !== 'DRAFT') {
      throw new BadRequestException('Hanya PO status DRAFT yang bisa diedit.');
    }

    return this.db.transaction(async (tx) => {
      let totalAmount = 0;
      for (const item of dto.items) {
        totalAmount += item.quantity * item.unitPrice;
      }

      await tx
        .update(purchaseOrders)
        .set({
          supplierName: dto.supplierName || 'EPSON',
          notes: dto.notes?.trim() ?? null,
          totalAmount: totalAmount.toString(),
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, id));

      await this.poItemsService.deleteItemsByPO(tx, id);
      await this.poItemsService.addItems(tx, id, dto.items);

      return { success: true, id, poNumber: po.poNumber };
    });
  }

  async updateStatus(
    id: number,
    newStatus: PoStatusType,
    performedBy?: number
  ) {
    const po = await this.findOne(id);
    const currentStatus = po.status as PoStatusType;

    this.validateTransition(currentStatus, newStatus);

    const updates: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === 'APPROVED') updates.approvedBy = performedBy;
    if (newStatus === 'ORDERED')
      updates.orderDate = new Date().toISOString().split('T')[0];
    if (newStatus === 'RECEIVED')
      updates.receivedDate = new Date().toISOString().split('T')[0];

    await this.db
      .update(purchaseOrders)
      .set(updates)
      .where(eq(purchaseOrders.id, id));

    return { success: true, message: `Status PO #${id} → ${newStatus}` };
  }

  async receivePO(id: number, dto: ReceivePoDto) {
    const receivedSparePartIds: number[] = [];

    const result = await this.db.transaction(async (tx) => {
      const po = await tx.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, id),
      });
      if (!po) throw new NotFoundException(`PO ID ${id} tidak ditemukan.`);

      const currentStatus = po.status as PoStatusType;
      this.validateTransition(currentStatus, 'RECEIVED');

      const items = await tx.query.poItems.findMany({
        where: eq(poItems.purchaseOrderId, id),
      });

      let allFullyReceived = true;

      for (const receiveItem of dto.items) {
        const poItem = items.find((i) => i.id === receiveItem.poItemId);
        if (!poItem)
          throw new BadRequestException(
            `Item ID ${receiveItem.poItemId} tidak ditemukan.`
          );

        let sparePartId = poItem.sparePartId!;

        if (!sparePartId) {
          const partName = poItem.partName || `PO Item #${poItem.id}`;

          const matchConditions = [eq(spareParts.partName, partName)];
          if (poItem.modelName) {
            matchConditions.push(eq(spareParts.modelName, poItem.modelName));
          }

          const existingPart = await tx.query.spareParts.findFirst({
            where: and(...matchConditions),
          });

          if (existingPart) {
            sparePartId = existingPart.id;
            await tx
              .update(poItems)
              .set({ sparePartId, partName })
              .where(eq(poItems.id, poItem.id));
          } else {
            const [newPart] = await tx
              .insert(spareParts)
              .values({
                partName,
                modelName: poItem.modelName || null,
                stock: 0,
                minStock: 5,
                price: poItem.unitPrice,
              })
              .returning({ id: spareParts.id });
            sparePartId = newPart.id;

            await tx
              .update(spareParts)
              .set({ partCode: String(sparePartId) })
              .where(eq(spareParts.id, sparePartId));

            await tx
              .update(poItems)
              .set({ sparePartId, partName })
              .where(eq(poItems.id, poItem.id));
          }
        }

        const currentReceived = poItem.receivedQty || 0;
        const cumulativeReceived = currentReceived + receiveItem.receivedQty;

        if (cumulativeReceived > poItem.quantity) {
          throw new BadRequestException(
            `Qty terima melebihi pesanan untuk item ${poItem.partName || `#${sparePartId}`}. Sudah diterima: ${currentReceived}, ingin menerima: ${receiveItem.receivedQty}, total pesanan: ${poItem.quantity}.`
          );
        }

        await this.poItemsService.updateReceivedQty(
          tx,
          poItem.id,
          receiveItem.receivedQty
        );

        await this.stockMovementsService.createMovement(
          {
            sparePartId,
            quantity: receiveItem.receivedQty,
            movementType: 'PO_RECEIVE',
            referenceType: 'PO_TICKET',
            referenceId: po.poNumber,
            performedBy: dto.performedBy,
          },
          tx
        );

        await this.stockMovementsService.updateStock(
          tx,
          sparePartId,
          receiveItem.receivedQty,
          'PO_RECEIVE'
        );

        await tx
          .update(spareParts)
          .set({
            price: poItem.unitPrice,
            updatedAt: new Date(),
          })
          .where(eq(spareParts.id, sparePartId));

        if (cumulativeReceived < poItem.quantity) {
          allFullyReceived = false;
        }

        receivedSparePartIds.push(sparePartId);
      }

      const finalStatus = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      await tx
        .update(purchaseOrders)
        .set({
          status: finalStatus,
          receivedDate:
            finalStatus === 'RECEIVED'
              ? new Date().toISOString().split('T')[0]
              : po.receivedDate,
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, id));

      return {
        success: true,
        status: finalStatus,
        message: `PO #${id} → ${finalStatus}`,
      };
    });

    if (receivedSparePartIds.length > 0) {
      this.eventEmitter.emit('purchase-order.received', {
        receivedSparePartIds,
        performedBy: dto.performedBy,
      });
    }

    return result;
  }

  private async generatePoNumber(): Promise<string> {
    const prefix = 'PO';
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

    return `${prefix}-${dateStr}-${String(counter).padStart(4, '0')}`;
  }
}
