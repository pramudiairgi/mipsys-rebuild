import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrderPartsModule } from '../order-parts/order-parts.module';
import { FinanceModule } from '../finance/finance.module';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestService } from './service-requests.service';
import { ServiceRequestCustomerResolver } from './services/customer-resolver.service';
import { ServiceRequestProductResolver } from './services/product-resolver.service';
import { ServiceRequestActivityService } from './services/activity.service';
import { ServiceRequestStatsService } from './services/stats.service';
import { ServiceRequestStateMachine } from './services/state-machine.service';
import { ServiceRequestListener } from './listeners/service-request.listener';

@Module({
  imports: [
    DatabaseModule,
    StockMovementsModule,
    InventoryModule,
    OrderPartsModule,
    FinanceModule,
  ],
  controllers: [ServiceRequestsController],
  providers: [
    ServiceRequestService,
    ServiceRequestCustomerResolver,
    ServiceRequestProductResolver,
    ServiceRequestActivityService,
    ServiceRequestStatsService,
    ServiceRequestStateMachine,
    ServiceRequestListener,
  ],
  exports: [ServiceRequestService],
})
export class ServiceRequestsModule {}
