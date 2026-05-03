import { Module } from "@nestjs/common";
import { ServiceRequestsModule } from "./service-requests/service-requests.module";
import { SparePartsModule } from './spare-parts/spare-parts.module';

@Module({
  imports: [ServiceRequestsModule, SparePartsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
