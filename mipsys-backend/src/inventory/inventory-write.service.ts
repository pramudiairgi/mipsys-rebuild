import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { spareParts } from '../database/schema';
import { InventoryReadService } from './inventory-read.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

@Injectable()
export class InventoryWriteService {
  private readonly logger = new Logger(InventoryWriteService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private readService: InventoryReadService
  ) {}

  async create(dto: CreateSparePartDto) {
    const existingByCode = await this.db
      .select({ id: spareParts.id })
      .from(spareParts)
      .where(eq(spareParts.partCode, dto.partCode.trim()))
      .limit(1);

    if (existingByCode.length > 0) {
      throw new BadRequestException(
        `Kode part '${dto.partCode}' sudah digunakan.`
      );
    }

    const existingByName = await this.readService.findByPartNameAndModel(
      dto.partName,
      dto.modelName
    );
    if (existingByName) {
      throw new BadRequestException(
        `Part dengan nama '${dto.partName}' dan model '${dto.modelName}' sudah ada (ID: ${existingByName.id}). Gunakan endpoint update untuk mengubah data.`
      );
    }

    const [created] = await this.db
      .insert(spareParts)
      .values({
        partCode: dto.partCode.trim(),
        partName: dto.partName.trim(),
        modelName: dto.modelName.trim(),
        block: dto.block?.trim(),
        stock: dto.stock ?? 0,
        price: dto.price.toString(),
      })
      .returning({
        id: spareParts.id,
        partCode: spareParts.partCode,
        partName: spareParts.partName,
        modelName: spareParts.modelName,
        block: spareParts.block,
        stock: spareParts.stock,
        price: spareParts.price,
      });

    return created;
  }

  async update(id: number, dto: UpdateSparePartDto) {
    await this.readService.getPartById(id);

    await this.db
      .update(spareParts)
      .set({
        ...dto,
        partCode: dto.partCode?.trim(),
        partName: dto.partName?.trim(),
        price: dto.price?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, id));

    return { success: true, message: 'Data suku cadang berhasil diperbarui.' };
  }
}
