import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { products } from '../../database/schema';
import { DrizzleTx } from '../../database/types';

@Injectable()
export class ServiceRequestProductResolver {
  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async resolveProductId(
    tx: DrizzleTx,
    serialNumber: string,
    modelName: string
  ): Promise<number> {
    const [existing] = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.serialNumber, serialNumber))
      .limit(1);

    if (existing) return existing.id;

    const [{ id }] = await tx
      .insert(products)
      .values({
        serialNumber: serialNumber.trim(),
        modelName: modelName.trim(),
      })
      .returning({ id: products.id });
    return id;
  }

  async updateProduct(
    tx: DrizzleTx,
    productId: number,
    data: { modelName?: string; serialNumber?: string }
  ) {
    await tx
      .update(products)
      .set({
        modelName: data.modelName?.trim(),
        serialNumber: data.serialNumber?.trim(),
      })
      .where(eq(products.id, productId));
  }
}
