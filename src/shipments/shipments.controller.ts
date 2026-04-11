import { Controller, Get } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';

@Controller('shipments') // Ini menentukan URL utama: http://localhost:3000/shipments
export class ShipmentsController {
  // Melalui Dependency Injection, kita panggil "Manajer" (Service)
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get() // Menangani permintaan GET pada URL /shipments
  async findAll() {
    // Meminta data ke Service
    const data = await this.shipmentsService.findAll();
    
    // Mengembalikan data dalam format JSON secara otomatis
    return {
      success: true,
      message: 'Data pengiriman berhasil diambil',
      data: data,
    };
  }
}