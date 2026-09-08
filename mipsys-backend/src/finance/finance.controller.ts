import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto, QueryInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@ApiTags('Finance')
@ApiBearerAuth('access-token')
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('invoices')
  @Roles('ADMIN')
  async findAll(@Query() query: QueryInvoiceDto) {
    return this.financeService.findAll(query.search, query.status);
  }

  @Get('invoices/:id')
  @Roles('ADMIN')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.findOne(id);
  }

  @Post('invoices')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInvoiceDto) {
    return this.financeService.create(dto);
  }

  @Post('invoices/:id/pay')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto
  ) {
    return this.financeService.recordPayment(id, dto);
  }

  @Patch('invoices/:id/void')
  @Roles('ADMIN')
  async voidInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.voidInvoice(id);
  }

  @Get('stats')
  @Roles('ADMIN', 'TECHNICIAN')
  async getStats() {
    return this.financeService.getStats();
  }

  @Post('invoices/from-sr/:ticketNumber')
  @Roles('ADMIN')
  async generateFromSR(@Param('ticketNumber') ticketNumber: string) {
    return this.financeService.generateFromServiceRequest(ticketNumber);
  }
}
