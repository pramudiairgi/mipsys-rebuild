import { Module } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';
@Module({
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService], // Tambahkan ScraperService di sini
})
export class ServiceRequestsModule {}