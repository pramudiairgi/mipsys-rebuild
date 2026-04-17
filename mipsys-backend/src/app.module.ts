import { Module } from '@nestjs/common';
import { ShipmentsModule } from './shipments/shipments.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';

@Module({
  imports: [ShipmentsModule, ServiceRequestsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
