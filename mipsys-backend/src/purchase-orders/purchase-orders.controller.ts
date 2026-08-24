import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePoHeaderDto } from './dto/create-po-header.dto';
import { ReceivePoDto } from './dto/receive-po.dto';
import type { PoStatusType } from './po-state-machine.guard';

@ApiTags('Purchase Orders')
@ApiBearerAuth('access-token')
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Get()
  async findAll() {
    return this.poService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.poService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePoHeaderDto) {
    return this.poService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePoHeaderDto
  ) {
    return this.poService.update(id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PoStatusType,
    @Body('performedBy') performedBy?: number
  ) {
    return this.poService.updateStatus(id, status, performedBy);
  }

  @Patch(':id/receive')
  async receivePO(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReceivePoDto
  ) {
    return this.poService.receivePO(id, dto);
  }
}
