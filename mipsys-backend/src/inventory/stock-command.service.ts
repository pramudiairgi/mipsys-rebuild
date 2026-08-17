import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../database/schema';
import { spareParts } from '../database/schema';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { InventoryReadService } from './inventory-read.service';
import { DrizzleTx } from '../database/types';

@Injectable()
export class StockCommandService {
  private readonly logger = new Logger(StockCommandService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>,
    private readService: InventoryReadService,
    private stockMovementsService: StockMovementsService,
    private eventEmitter: EventEmitter2
  ) {}

  async addStock(id: number, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException('Jumlah penambahan harus positif.');

    await this.readService.getPartById(id);

    await this.stockMovementsService.createMovement({
      sparePartId: id,
      quantity,
      movementType: 'ADJUSTMENT',
      notes: `Penambahan stok manual: +${quantity}`,
    });

    await this.stockMovementsService.updateStock(
      this.db,
      id,
      quantity,
      'ADJUSTMENT'
    );

    return { success: true, message: 'Stok berhasil ditambah.' };
  }

  async reduceStock(id: number, quantity: number) {
    if (quantity <= 0)
      throw new BadRequestException('Jumlah pengurangan harus positif.');

    await this.readService.getPartById(id);

    await this.stockMovementsService.createMovement({
      sparePartId: id,
      quantity: -quantity,
      movementType: 'ADJUSTMENT',
      notes: `Pengurangan stok manual: -${quantity}`,
    });

    await this.stockMovementsService.updateStock(
      this.db,
      id,
      -quantity,
      'ADJUSTMENT'
    );

    return { success: true, message: 'Stok berhasil dikurangi.' };
  }

  async reserveStock(
    sparePartId: number,
    quantity: number,
    srTicketNumber: string,
    performedBy: number,
    tx?: DrizzleTx
  ) {
    const exec = async (db: DrizzleTx) => {
      const part = await db.query.spareParts.findFirst({
        where: eq(spareParts.id, sparePartId),
      });

      if (!part)
        throw new NotFoundException(`Part ID ${sparePartId} tidak ditemukan.`);

      if (part.stock === 0 || quantity > part.stock) {
        throw new BadRequestException(
          part.stock === 0
            ? `Stok ${part.partName} kosong.`
            : `Stok ${part.partName} tidak mencukupi. Tersedia: ${part.stock}, dibutuhkan: ${quantity}`
        );
      }

      const newStock = part.stock - quantity;

      await this.stockMovementsService.createMovement(
        {
          sparePartId,
          quantity: -quantity,
          movementType: 'SERVICE_USE',
          referenceType: 'SR_TICKET',
          referenceId: srTicketNumber,
          performedBy,
        },
        db
      );

      await this.stockMovementsService.updateStock(
        db,
        sparePartId,
        -quantity,
        'SERVICE_USE'
      );

      return {
        success: true,
        softBlock: false,
        needsAutoPo: part.minStock !== null && newStock < part.minStock,
        autoPoTriggered: false,
        newStock,
        sparePartId,
        message: `Stok ${part.partName} dikurangi ${quantity}`,
      };
    };

    const isRootCaller = !tx;

    const result = tx
      ? await exec(tx)
      : await this.db.transaction((db) => exec(db));

    if (result.needsAutoPo) {
      this.eventEmitter.emit('stock.level-changed', {
        sparePartId: result.sparePartId,
        newStock: result.newStock,
      });
    }

    return {
      ...result,
      autoPoTriggered: result.needsAutoPo && isRootCaller,
    };
  }
}
