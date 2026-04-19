import { Module } from "@nestjs/common";
import { ServiceRequestsController } from "./service-requests.controller";
import { ServiceRequestService } from "./service-requests.service";

// 1. Import mesin database Drizzle yang sudah Mas Irgi buat (sesuaikan jalurnya jika berbeda)
import { db } from "../db/db";

@Module({
  controllers: [ServiceRequestsController],
  providers: [
    ServiceRequestService,

    // 2. Registrasikan 'DB_CONNECTION' ke dalam Module
    {
      provide: "DB_CONNECTION", // Nama kunci (Keran) yang diminta oleh Service
      useValue: db, // Isi airnya (Mesin database aslinya)
    },
  ],
})
export class ServiceRequestsModule {}
