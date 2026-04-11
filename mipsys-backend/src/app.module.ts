import { Module } from '@nestjs/common';
import { ShipmentsModule } from './shipments/shipments.module';

@Module({
  imports: [ShipmentsModule],
})
export class AppModule {}
