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
} from '@nestjs/common';
import { ServiceRequestService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { DiagnoseSrDto } from './dto/diagnose-sr.dto';
import { ApproveQuoteDto } from './dto/approve-quote.dto';
import { SaveQuoteDto } from './dto/save-quote.dto';
import { CancelQuoteDto } from './dto/cancel-quote.dto';
import { CurrentStaffId } from '../auth/current-staff-id.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('service-request')
@ApiBearerAuth('access-token')
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
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateServiceRequestDto,
    @CurrentStaffId() staffId: number
  ) {
    return await this.serviceRequestService.createEntry(createDto, staffId);
  }

  @Patch(':ticketNumber')
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
  @HttpCode(HttpStatus.OK)
  async diagnose(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: DiagnoseSrDto
  ) {
    return this.serviceRequestService.diagnose(ticketNumber, dto);
  }

  @Post(':ticketNumber/save-quote')
  @HttpCode(HttpStatus.OK)
  async saveQuote(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: SaveQuoteDto
  ) {
    return this.serviceRequestService.saveQuote(ticketNumber, dto);
  }

  @Post(':ticketNumber/cancel-quote')
  @HttpCode(HttpStatus.OK)
  async cancelQuote(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: CancelQuoteDto
  ) {
    return this.serviceRequestService.cancelQuote(ticketNumber, dto);
  }

  @Post(':ticketNumber/retry-awaiting-parts')
  @HttpCode(HttpStatus.OK)
  async retryAwaitingParts(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: CancelQuoteDto
  ) {
    return this.serviceRequestService.retryAwaitingParts(ticketNumber, dto);
  }

  @Post(':ticketNumber/close')
  @HttpCode(HttpStatus.OK)
  async closeTicket(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: { performedBy?: number }
  ) {
    return this.serviceRequestService.closeTicket(ticketNumber, dto);
  }

  @Post(':ticketNumber/approve-quote')
  @HttpCode(HttpStatus.OK)
  async approveQuote(
    @Param('ticketNumber') ticketNumber: string,
    @Body() dto: ApproveQuoteDto
  ) {
    return this.serviceRequestService.approveQuote(ticketNumber, dto);
  }
}
