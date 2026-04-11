import { Injectable } from '@nestjs/common';
import { db } from '../db/db';
import { shipments } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ShipmentsRepository {
  async findByPicklist(no: string) {
    return await db.select().from(shipments).where(eq(shipments.picklist_no, no));
  }

  async create(data: any) {
    return await db.insert(shipments).values(data);
  }

  async findAll() {
    return await db.select().from(shipments);
  }
}