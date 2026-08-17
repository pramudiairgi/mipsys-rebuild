import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { categoryModels } from '../database/schema';

@Injectable()
export class CategoryModelsService {
  private readonly logger = new Logger(CategoryModelsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async findAll() {
    return this.db.query.categoryModels.findMany({
      orderBy: [categoryModels.name],
    });
  }

  async findOne(id: number) {
    const model = await this.db.query.categoryModels.findFirst({
      where: eq(categoryModels.id, id),
    });
    if (!model) throw new NotFoundException(`Model ID ${id} tidak ditemukan.`);
    return model;
  }

  async create(name: string, description?: string) {
    const [result] = await this.db
      .insert(categoryModels)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .returning({ id: categoryModels.id });
    return { success: true, id: result.id, name: name.trim() };
  }

  async update(id: number, name: string, description?: string) {
    await this.findOne(id);
    await this.db
      .update(categoryModels)
      .set({
        name: name.trim(),
        description: description?.trim() ?? null,
        updatedAt: new Date(),
      })
      .where(eq(categoryModels.id, id));
    return { success: true, id };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.db.delete(categoryModels).where(eq(categoryModels.id, id));
    return { success: true, id };
  }
}
