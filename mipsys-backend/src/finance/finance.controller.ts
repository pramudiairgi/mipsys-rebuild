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
import { FinanceService } from './finance.service';
import { CreateInvoiceDto, QueryInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('invoices')
  async findAll(@Query() query: QueryInvoiceDto) {
    return this.financeService.findAll(query.search, query.status);
  }

  @Get('invoices/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.findOne(id);
  }

  @Post('invoices')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateInvoiceDto) {
    return this.financeService.create(dto);
  }

  @Post('invoices/:id/pay')
  @HttpCode(HttpStatus.CREATED)
  async recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto
  ) {
    return this.financeService.recordPayment(id, dto);
  }

  @Patch('invoices/:id/void')
  async voidInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.financeService.voidInvoice(id);
  }

  @Get('stats')
  async getStats() {
    return this.financeService.getStats();
  }

  @Post('invoices/from-sr/:ticketNumber')
  async generateFromSR(@Param('ticketNumber') ticketNumber: string) {
    return this.financeService.generateFromServiceRequest(ticketNumber);
  }
}
