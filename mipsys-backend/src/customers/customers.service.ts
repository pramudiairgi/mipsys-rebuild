import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, like, or, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { customers } from '../database/schema';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async findAll(search?: string) {
    return this.db.query.customers.findMany({
      where: search
        ? or(
            like(customers.name, `%${search}%`),
            like(customers.phone, `%${search}%`)
          )
        : undefined,
      orderBy: [customers.name],
    });
  }

  async findOne(id: number) {
    const row = await this.db.query.customers.findFirst({
      where: eq(customers.id, id),
    });
    if (!row) throw new NotFoundException(`Customer ID ${id} tidak ditemukan.`);
    return row;
  }

  async create(data: {
    name: string;
    phone?: string;
    address?: string;
    customerType?: string;
  }) {
    const [result] = await this.db
      .insert(customers)
      .values({
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        customerType: data.customerType?.trim() || null,
      })
      .returning({ id: customers.id });
    return { success: true, id: result.id };
  }

  async update(
    id: number,
    data: {
      name?: string;
      phone?: string;
      address?: string;
      customerType?: string;
    }
  ) {
    await this.findOne(id);
    await this.db.update(customers).set(data).where(eq(customers.id, id));
    return { success: true, id };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(customers).where(eq(customers.id, id));
    return { success: true, id };
  }

  async count() {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(customers);
    return { count: Number(row?.count ?? 0) };
  }
}
