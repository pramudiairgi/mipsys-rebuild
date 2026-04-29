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

  // 1. DASHBOARD UTAMA (TABEL & PAGINASI)
  @Get('dashboard')
  async getDashboard(
    @Query('search', new DefaultValuePipe('')) search: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ) {
    return await this.srService.getAllDashboard(search, page, limit);
  }

  // 2. STATISTIK COUNTER (PENTING: Harus di atas :ticketNumber)
  // Endpoint: GET /service-request/stats
  @Get('stats')
  async getStats() {
    return await this.srService.getDashboardStats();
  }

  // 3. LOG AKTIVITAS TERKINI
  // Endpoint: GET /service-request/activities
  @Get('activities')
  async getActivities() {
    return await this.srService.getLatestActivities();
  }

  // 4. DATA MASTER TEKNISI
  @Get('technicians')
  async getTechnicians() {
    return await this.srService.findAllTechnicians();
  }

  // 5. DETAIL TIKET (Diletakkan di bawah agar rute statis tidak ter-intercept)
  @Get(':ticketNumber')
  async getDetail(@Param('ticketNumber') ticketNumber: string) {
    return await this.srService.getDetailByTicketNumber(ticketNumber);
  }

  // 6. ENTRY UNIT BARU
  @Post('entry')
  async create(@Body() createDto: CreateServiceRequestDto) {
    return await this.srService.createEntry(createDto, createDto.adminId);
  }

  // 7. DIAGNOSA TEKNISI (PATCH)
  @Patch(':id/diagnosis')
  async updateTechnician(
    @Param('id') id: string, // Menggunakan Ticket Number
    @Body() updateTechDto: UpdateTechRequestDto
  ) {
    return await this.srService.updateTechDiagnosis(id, updateTechDto);
  }

  // 8. PROSES KASIR (PATCH)
  @Patch(':id/kasir')
  async jalankanKasir(@Param('id') id: string, @Body() dto: InputBiayaDto) {
    return await this.srService.prosesKasir(id, dto);
  }
}
