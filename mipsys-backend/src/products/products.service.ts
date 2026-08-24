import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, like, or } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { products, serviceRequests } from '../database/schema';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async findAll(search?: string) {
    return this.db.query.products.findMany({
      where: search
        ? or(
            like(products.modelName, `%${search}%`),
            like(products.serialNumber, `%${search}%`)
          )
        : undefined,
      orderBy: [products.modelName],
    });
  }

  async findOne(id: number) {
    const row = await this.db.query.products.findFirst({
      where: eq(products.id, id),
    });
    if (!row) throw new NotFoundException(`Product ID ${id} tidak ditemukan.`);
    return row;
  }

  async create(data: { modelName: string; serialNumber: string }) {
    const [result] = await this.db
      .insert(products)
      .values({
        modelName: data.modelName.trim(),
        serialNumber: data.serialNumber.trim(),
      })
      .returning({ id: products.id });
    return { success: true, id: result.id };
  }

  async update(
    id: number,
    data: { modelName?: string; serialNumber?: string }
  ) {
    await this.findOne(id);
    await this.db.update(products).set(data).where(eq(products.id, id));
    return { success: true, id };
  }

  async remove(id: number) {
    await this.findOne(id);
    const refs = await this.db.query.serviceRequests.findFirst({
      where: eq(serviceRequests.productId, id),
    });
    if (refs) {
      throw new BadRequestException(
        `Produk ID ${id} masih digunakan pada tiket ${refs.ticketNumber} dan tidak dapat dihapus.`,
      );
    }
    try {
      await this.db.delete(products).where(eq(products.id, id));
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('violates foreign key') ||
          (error as any).code === '23503')
      ) {
        throw new BadRequestException(
          `Produk ID ${id} masih digunakan dan tidak dapat dihapus.`,
        );
      }
      throw error;
    }
    return { success: true, id };
  }
}
