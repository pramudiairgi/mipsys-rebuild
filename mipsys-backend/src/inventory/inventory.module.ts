import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { InventoryController } from './inventory.controller';
import { SparePartsController } from './spare-parts.controller';
import { InventoryReadService } from './inventory-read.service';
import { InventoryWriteService } from './inventory-write.service';
import { StockCommandService } from './stock-command.service';
import { InventoryListener } from './listeners/inventory.listener';

@Module({
  imports: [DatabaseModule, StockMovementsModule],
  controllers: [InventoryController, SparePartsController],
  providers: [
    InventoryReadService,
    InventoryWriteService,
    StockCommandService,
    InventoryListener,
  ],
  exports: [InventoryReadService, InventoryWriteService, StockCommandService],
})
export class InventoryModule {}
