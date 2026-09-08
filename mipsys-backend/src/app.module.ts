import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { FinanceModule } from './finance/finance.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { OrderPartsModule } from './order-parts/order-parts.module';
import { CategoryModelsModule } from './category-models/category-models.module';
import { CustomersModule } from './customers/customers.module';
import { StaffModule } from './staff/staff.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    ServiceRequestsModule,
    PurchaseOrdersModule,
    FinanceModule,
    InventoryModule,
    StockMovementsModule,
    OrderPartsModule,
    CategoryModelsModule,
    CustomersModule,
    StaffModule,
    ProductsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
