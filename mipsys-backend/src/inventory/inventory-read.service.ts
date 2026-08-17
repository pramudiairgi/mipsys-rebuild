import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, like, ilike, or, desc, and, sql, lt, gt } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { spareParts, categoryModels } from '../database/schema';

@Injectable()
export class InventoryReadService {
  private readonly logger = new Logger(InventoryReadService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async getModels(): Promise<string[]> {
    const rows = await this.db
      .select({ name: categoryModels.name })
      .from(categoryModels)
      .orderBy(categoryModels.name);
    return rows.map((r) => r.name);
  }

  async searchParts(query: string) {
    const pattern = `%${query}%`;
    return this.db.query.spareParts.findMany({
      where: or(
        ilike(spareParts.partName, pattern),
        ilike(spareParts.partCode, pattern)
      ),
      orderBy: [desc(spareParts.stock)],
      limit: 50,
    });
  }

  async getAll(params?: { search?: string; page?: number; limit?: number }) {
    const search = params?.search;
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const conditions: ReturnType<typeof sql>[] = [];

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(spareParts.partName, pattern),
          like(spareParts.partCode, pattern)
        ) as any
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ count }]] = await Promise.all([
      this.db.query.spareParts.findMany({
        where,
        orderBy: [desc(spareParts.createdAt)],
        limit,
        offset: (page - 1) * limit,
      }),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(spareParts)
        .where(where ?? undefined),
    ]);

    const total = Number(count);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  async getParts(filters?: {
    status?: 'ok' | 'low' | 'empty';
    search?: string;
  }) {
    const conditions: ReturnType<typeof sql>[] = [];

    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(spareParts.partName, pattern),
          like(spareParts.partCode, pattern)
        ) as any
      );
    }

    if (filters?.status === 'ok') {
      conditions.push(sql`${spareParts.stock} >= ${spareParts.minStock}`);
    } else if (filters?.status === 'low') {
      conditions.push(
        and(
          gt(spareParts.stock, 0),
          sql`${spareParts.stock} < ${spareParts.minStock}`
        ) as any
      );
    } else if (filters?.status === 'empty') {
      conditions.push(eq(spareParts.stock, 0));
    }

    return this.db.query.spareParts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(spareParts.partCode)],
    });
  }

  async getPartById(id: number) {
    const part = await this.db.query.spareParts.findFirst({
      where: eq(spareParts.id, id),
    });
    if (!part) throw new NotFoundException(`Part ID ${id} tidak ditemukan.`);
    return part;
  }

  async getLowStockAlert() {
    return this.db.query.spareParts.findMany({
      where: lt(spareParts.stock, spareParts.minStock),
      orderBy: [desc(spareParts.stock)],
    });
  }

  async findByPartNameAndModel(partName: string, modelName?: string) {
    const conditions: ReturnType<typeof sql>[] = [
      eq(spareParts.partName, partName.trim()),
    ];
    if (modelName) {
      conditions.push(eq(spareParts.modelName, modelName.trim()));
    }
    return this.db.query.spareParts.findFirst({
      where: and(...conditions),
    });
  }
}
