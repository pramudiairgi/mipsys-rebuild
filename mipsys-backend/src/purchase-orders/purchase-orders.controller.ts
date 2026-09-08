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
import { CurrentStaffId } from '../auth/current-staff-id.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';

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
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePoHeaderDto) {
    return this.poService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePoHeaderDto
  ) {
    return this.poService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'TECHNICIAN')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: PoStatusType,
    @Body('performedBy') performedBy: number | undefined,
    @CurrentStaffId() staffId: number,
    @CurrentUser() user: any,
  ) {
    const po = await this.poService.findOne(id);
    const current = po.status as PoStatusType;
    // TECHNICIAN hanya boleh DRAFT -> REQUESTED (minta approval) dan DRAFT CANCEL
    if (user?.role === 'TECHNICIAN') {
      const allowed =
        (current === 'DRAFT' && (status === 'REQUESTED' || status === 'CANCELLED'));
      if (!allowed) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ForbiddenException } = await import('@nestjs/common');
        throw new ForbiddenException('Akses ditolak: teknisi hanya boleh minta approval (DRAFT → REQUESTED).');
      }
    }
    return this.poService.updateStatus(id, status, staffId ?? performedBy);
  }

  @Patch(':id/receive')
  @Roles('ADMIN')
  async receivePO(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReceivePoDto,
    @CurrentStaffId() staffId: number,
  ) {
    if (staffId) (dto as any).performedBy = staffId;
    return this.poService.receivePO(id, dto);
  }
}
