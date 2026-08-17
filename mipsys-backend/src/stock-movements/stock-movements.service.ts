import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { stockMovements, spareParts } from '../database/schema';
import {
  CreateStockMovementDto,
  MovementTypeType,
} from './dto/create-stock-movement.dto';

type DrizzleTx = Parameters<
  Parameters<NodePgDatabase<typeof schema>['transaction']>[0]
>[0];

@Injectable()
export class StockMovementsService {
  private readonly logger = new Logger(StockMovementsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async createMovement(dto: CreateStockMovementDto, tx?: DrizzleTx) {
    if (dto.movementType === 'ADJUSTMENT' && !dto.notes?.trim()) {
      throw new BadRequestException('ADJUSTMENT wajib menyertakan catatan');
    }

    if (dto.quantity === 0) {
      throw new BadRequestException('Quantity tidak boleh nol');
    }

    const targetDb = tx || this.db;

    try {
      await targetDb.insert(stockMovements).values({
        sparePartId: dto.sparePartId,
        quantity: dto.quantity,
        movementType: dto.movementType,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        performedBy: dto.performedBy ?? null,
        notes: dto.notes?.trim() ?? null,
      });

      return { success: true, message: 'Stock movement recorded' };
    } catch (error) {
      this.logger.error('Failed to create stock movement', error as Error);
      throw new InternalServerErrorException('Gagal mencatat pergerakan stok.');
    }
  }

  async getMovementsByPart(sparePartId: number) {
    return this.db.query.stockMovements.findMany({
      where: eq(stockMovements.sparePartId, sparePartId),
      orderBy: [desc(stockMovements.createdAt)],
    });
  }

  async updateStock(
    db: DrizzleTx | NodePgDatabase<typeof schema>,
    sparePartId: number,
    quantity: number,
    movementType: MovementTypeType
  ) {
    const [current] = await db
      .select({ stock: spareParts.stock })
      .from(spareParts)
      .where(eq(spareParts.id, sparePartId))
      .limit(1);

    if (!current) {
      throw new BadRequestException(`Part ID ${sparePartId} tidak ditemukan.`);
    }

    const newStock = current.stock + quantity;

    if (
      newStock < 0 &&
      (movementType === 'SERVICE_USE' || movementType === 'ADJUSTMENT')
    ) {
      throw new BadRequestException(
        `Stok tidak mencukupi. Tersedia: ${current.stock}, dibutuhkan: ${Math.abs(quantity)}`
      );
    }

    await db
      .update(spareParts)
      .set({
        stock: newStock,
        updatedAt: new Date(),
      })
      .where(eq(spareParts.id, sparePartId));
  }
}
