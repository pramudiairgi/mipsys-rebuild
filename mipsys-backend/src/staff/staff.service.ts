import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { staff } from '../database/schema';

@Injectable()
export class StaffService {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async findAll() {
    return this.db.query.staff.findMany({ orderBy: [staff.name] });
  }

  async findOne(id: number) {
    const row = await this.db.query.staff.findFirst({
      where: eq(staff.id, id),
    });
    if (!row) throw new NotFoundException(`Staff ID ${id} tidak ditemukan.`);
    return row;
  }

  async create(data: { name: string; role: 'ADMIN' | 'TECHNICIAN' }) {
    const [result] = await this.db
      .insert(staff)
      .values(data)
      .returning({ id: staff.id });
    return { success: true, id: result.id };
  }

  async update(
    id: number,
    data: { name?: string; role?: 'ADMIN' | 'TECHNICIAN' }
  ) {
    await this.findOne(id);
    await this.db.update(staff).set(data).where(eq(staff.id, id));
    return { success: true, id };
  }

  async remove(id: number) {
    await this.findOne(id);
    try {
      await this.db.delete(staff).where(eq(staff.id, id));
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('violates foreign key') ||
          (error as any).code === '23503')
      ) {
        throw new BadRequestException(
          `Staff ID ${id} masih digunakan dan tidak dapat dihapus.`,
        );
      }
      throw error;
    }
    return { success: true, id };
  }

  async count(role?: string) {
    if (role) {
      const [row] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(staff)
        .where(eq(staff.role as any, role));
      return { count: Number(row?.count ?? 0) };
    }
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(staff);
    return { count: Number(row?.count ?? 0) };
  }
}
