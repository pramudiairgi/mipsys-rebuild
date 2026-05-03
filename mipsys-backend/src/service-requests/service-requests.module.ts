import { Module } from '@nestjs/common';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestService } from './service-requests.service';
import { db } from '../db/db';
import { SparePartsModule } from 'src/spare-parts/spare-parts.module';

@Module({
  imports: [SparePartsModule],
  controllers: [ServiceRequestsController],
  providers: [
    ServiceRequestService,
    {
      provide: 'DB_CONNECTION',
      useValue: db,
    },
  ],
})
export class ServiceRequestsModule {}
