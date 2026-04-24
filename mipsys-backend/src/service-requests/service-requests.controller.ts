import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ServiceRequestService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';
import { InputBiayaDto } from './dto/input-biaya.dto';

@Controller('service-request')
export class ServiceRequestsController {
  constructor(private readonly srService: ServiceRequestService) {}

  // 1. Dashboard Resepsionis
  @Get('dashboard')
  async getDashboard(
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return await this.srService.getAllDashboard(search, page, limit);
  }

  @Get('technicians')
  async getTechnicians() {
    return await this.srService.findAllTechnicians();
  }

  // Parameter 'id' di sini idealnya diisi dengan Ticket Number (contoh: IDW5-123)
  @Get(':ticketNumber')
  async getDetail(@Param('ticketNumber') ticketNumber: string) {
    return await this.srService.getDetailByTicketNumber(ticketNumber);
  }

  // 2. Form Entry Baru / Resepsionis (POST)
  @Post('entry')
  async create(@Body() createDto: CreateServiceRequestDto) {
    return await this.srService.createEntry(createDto, createDto.adminId);
  }

  // 3. Update Teknisi & Input Sparepart (PATCH)
  @Patch(':id/diagnosis')
  async updateTechnician(
    @Param('id') id: string, // Gunakan Ticket Number
    @Body() updateTechDto: UpdateTechRequestDto
  ) {
    return await this.srService.updateTechDiagnosis(id, updateTechDto);
  }

  // 4. Update Kasir / Biaya (PATCH)
  @Patch(':id/kasir')
  async jalankanKasir(
    @Param('id') id: string, // Gunakan Ticket Number
    @Body() dto: InputBiayaDto
  ) {
    return await this.srService.prosesKasir(id, dto);
  }
}
