import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateTechRequestDto } from './dto/update-tech-request.dto';
import { InputBiayaDto } from './dto/input-biaya.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly srService: ServiceRequestsService) {}

  // 1. Dashboard Resepsionis
  @Get('dashboard')
  async getDashboard(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    // Berikan nilai default jika kosong, lalu oper ke Service
    const keyword = search || '';
    const currentPage = page ? Number(page) : 1;
    const currentLimit = limit ? Number(limit) : 10;

    return await this.srService.getAllDashboard(
      keyword,
      currentPage,
      currentLimit,
    );
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    return await this.srService.getDetailById(id);
  }

  // 2. Form Entry Baru / Resepsionis (POST)
  @Post('entry')
  async create(@Body() createDto: CreateServiceRequestDto) {
    return await this.srService.createEntry(createDto);
  }

  @Post('sync')
  async syncLegacy() {
    return await this.srService.syncFromLegacy();
  }

  // 3. Update Teknisi & Input Sparepart (PATCH)
  @Patch(':id/technician')
  async updateTechnician(
    @Param('id') id: string,
    @Body() updateTechDto: UpdateTechRequestDto,
  ) {
    return await this.srService.updateTechDiagnosis(id, updateTechDto);
  }

  @Patch(':id/kasir')
  async jalankanKasir(@Param('id') id: string, @Body() dto: InputBiayaDto) {
    return await this.srService.prosesKasir(id, dto);
  }

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file')) // Nama field di Postman harus 'file'
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    return await this.srService.importFromExcel(file);
  }
}
