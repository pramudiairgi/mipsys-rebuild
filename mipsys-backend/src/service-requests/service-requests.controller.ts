import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ServiceRequestService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { DiagnoseSrDto } from './dto/diagnose-sr.dto';
import { ApproveQuoteDto } from './dto/approve-quote.dto';
import { SaveQuoteDto } from './dto/save-quote.dto';
import { CancelQuoteDto } from './dto/cancel-quote.dto';
import { CurrentStaffId } from '../auth/current-staff-id.decorator';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Service Requests')
@ApiBearerAuth('access-token')
@Controller('service-request')
export class ServiceRequestsController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Get('dashboard')
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string
  ) {
    return await this.serviceRequestService.findAll({
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      status,
    });
  }

  @Get('export/xlsx')
  async exportXlsx(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const buffer = await this.serviceRequestService.exportXlsx({ search, status });
    const date = new Date().toISOString().slice(0, 10);
    res!.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="summary-report-${date}.xlsx"`,
    });
    res!.end(buffer);
  }

  @Get('activities')
  async getActivities() {
    return await this.serviceRequestService.getActivities();
  }

  @Get('stats')
  async getStats() {
    return await this.serviceRequestService.getDashboardStats();
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    return await this.serviceRequestService.findOne(id);
  }

  @Post('entry')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateServiceRequestDto,
    @CurrentStaffId() staffId: number
  ) {
    return await this.serviceRequestService.createEntry(createDto, staffId);
  }

  @Patch(':ticketNumber')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('ticketNumber') ticketNumber: string,
    @Body() updateDto: CreateServiceRequestDto
  ) {
    return await this.serviceRequestService.updateEntry(
      ticketNumber,
      updateDto
    );
  }

  @Post(':ticketNumber/diagnose')
  @Roles('TECHNICIAN')
  @HttpCode(HttpStatus.OK)
  async diagnose(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: DiagnoseSrDto,
    @CurrentStaffId() staffId: number,
  ) {
    if (staffId) dto.performedBy = staffId;
    return this.serviceRequestService.diagnose(ticketNumber, dto);
  }

  @Post(':ticketNumber/save-quote')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async saveQuote(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: SaveQuoteDto,
    @CurrentStaffId() staffId: number,
  ) {
    if (staffId) (dto as any).performedBy = staffId;
    return this.serviceRequestService.saveQuote(ticketNumber, dto);
  }

  @Post(':ticketNumber/cancel-quote')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async cancelQuote(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: CancelQuoteDto,
    @CurrentStaffId() staffId: number,
  ) {
    if (staffId) dto.performedBy = staffId;
    return this.serviceRequestService.cancelQuote(ticketNumber, dto);
  }

  @Post(':ticketNumber/retry-awaiting-parts')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async retryAwaitingParts(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: CancelQuoteDto,
    @CurrentStaffId() staffId: number,
  ) {
    if (staffId) dto.performedBy = staffId;
    return this.serviceRequestService.retryAwaitingParts(ticketNumber, dto);
  }

  @Post(':ticketNumber/close')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async closeTicket(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: { performedBy?: number },
    @CurrentStaffId() staffId: number,
  ) {
    if (staffId) dto.performedBy = staffId;
    return this.serviceRequestService.closeTicket(ticketNumber, dto);
  }

  @Post(':ticketNumber/approve-quote')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async approveQuote(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: ApproveQuoteDto,
    @CurrentStaffId() staffId: number,
  ) {
    if (staffId) (dto as any).performedBy = staffId;
    return this.serviceRequestService.approveQuote(ticketNumber, dto);
  }
}
