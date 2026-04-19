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
  ParseIntPipe, // <--- Tambahan impor
  DefaultValuePipe, // <--- Tambahan impor
} from "@nestjs/common";
import { ServiceRequestService } from "./service-requests.service";
import { CreateServiceRequestDto } from "./dto/create-service-request.dto";
import { UpdateTechRequestDto } from "./dto/update-tech-request.dto";
import { InputBiayaDto } from "./dto/input-biaya.dto";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("service-requests")
export class ServiceRequestsController {
  constructor(private readonly srService: ServiceRequestService) {}

  // 1. Dashboard Resepsionis
  @Get("dashboard")
  async getDashboard(
    @Query("search", new DefaultValuePipe("")) search: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    // Tidak perlu lagi if-else manual di sini!
    // NestJS sudah menjamin 'page' dan 'limit' pasti berupa angka yang valid.
    return await this.srService.getAllDashboard(search, page, limit);
  }

  // Parameter 'id' di sini idealnya diisi dengan Ticket Number (contoh: IDW5-123)
  @Get(":id")
  async getDetail(@Param("id") id: string) {
    return await this.srService.getDetailById(id);
  }

  // 2. Form Entry Baru / Resepsionis (POST)
  @Post("entry")
  async create(@Body() createDto: CreateServiceRequestDto) {
    return await this.srService.createEntry(createDto);
  }

  // 3. Update Teknisi & Input Sparepart (PATCH)
  @Patch(":id/technician")
  async updateTechnician(
    @Param("id") id: string, // Gunakan Ticket Number
    @Body() updateTechDto: UpdateTechRequestDto,
  ) {
    return await this.srService.updateTechDiagnosis(id, updateTechDto);
  }

  // 4. Update Kasir / Biaya (PATCH)
  @Patch(":id/kasir")
  async jalankanKasir(
    @Param("id") id: string, // Gunakan Ticket Number
    @Body() dto: InputBiayaDto,
  ) {
    return await this.srService.prosesKasir(id, dto);
  }
}
