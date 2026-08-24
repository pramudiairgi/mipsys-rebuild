import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, and, ne, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { orderParts, spareParts } from '../database/schema';
import { orderPartStatusEnum } from '../database/schema/enums';
import { CreateOrderPartDto } from './dto/create-order-part.dto';

type DrizzleTx = Parameters<
  Parameters<NodePgDatabase<typeof schema>['transaction']>[0]
>[0];

type OrderPartStatus = (typeof orderPartStatusEnum.enumValues)[number];

@Injectable()
export class OrderPartsService {
  private readonly logger = new Logger(OrderPartsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async addPart(dto: CreateOrderPartDto, tx?: DrizzleTx, status?: string) {
    const targetDb = tx || this.db;

    const part = await targetDb.query.spareParts.findFirst({
      where: eq(spareParts.id, dto.sparePartId),
    });
    if (!part)
      throw new NotFoundException(
        `Part ID ${dto.sparePartId} tidak ditemukan.`
      );

    const priceAtAction = part.price || '0.00';

    const existing = await targetDb.query.orderParts.findFirst({
      where: and(
        eq(orderParts.serviceRequestId, dto.serviceRequestId),
        eq(orderParts.sparePartId, dto.sparePartId),
        ne(orderParts.status, 'CANCELLED')
      ),
    });

    if (existing) {
      await targetDb
        .update(orderParts)
        .set({ quantity: existing.quantity + dto.quantity })
        .where(eq(orderParts.id, existing.id));

      return { success: true, id: existing.id, priceAtAction, updated: true };
    }

    const [result] = await targetDb
      .insert(orderParts)
      .values({
        serviceRequestId: dto.serviceRequestId,
        sparePartId: dto.sparePartId,
        partName: part.partName,
        quantity: dto.quantity,
        priceAtAction,
        status: (status ?? 'IN_STOCK') as OrderPartStatus,
      })
      .returning({ id: orderParts.id });

    return { success: true, id: result.id, priceAtAction };
  }

  async getByServiceRequest(serviceRequestId: number) {
    return this.db.query.orderParts.findMany({
      where: eq(orderParts.serviceRequestId, serviceRequestId),
      orderBy: [desc(orderParts.createdAt)],
    });
  }

  async removePart(id: number, tx?: DrizzleTx) {
    const targetDb = tx || this.db;
    await targetDb
      .update(orderParts)
      .set({ status: 'CANCELLED' })
      .where(eq(orderParts.id, id));
    return { success: true };
  }

  async getTotalPartsCost(serviceRequestId: number): Promise<number> {
    const parts = await this.db.query.orderParts.findMany({
      where: and(
        eq(orderParts.serviceRequestId, serviceRequestId),
        ne(orderParts.status, 'CANCELLED'),
      ),
    });

    return parts.reduce((sum, p) => {
      const price = parseFloat(p.priceAtAction || '0');
      const qty = p.quantity || 0;
      return sum + price * qty;
    }, 0);
  }
}
