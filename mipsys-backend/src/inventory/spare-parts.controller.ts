import {
  Controller,
  Query,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { InventoryReadService } from './inventory-read.service';
import { InventoryWriteService } from './inventory-write.service';
import { StockCommandService } from './stock-command.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

@ApiTags('Spare Parts')
@ApiBearerAuth('access-token')
@Controller('spare-parts')
export class SparePartsController {
  constructor(
    private readonly readService: InventoryReadService,
    private readonly writeService: InventoryWriteService,
    private readonly stockCommand: StockCommandService
  ) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number
  ) {
    return await this.readService.getAll({ search, page, limit });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.readService.getPartById(id);
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: CreateSparePartDto) {
    return await this.writeService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSparePartDto
  ) {
    return await this.writeService.update(id, dto);
  }

  @Patch(':id/add-stock')
  @Roles('ADMIN')
  async addStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) qty: number
  ) {
    return await this.stockCommand.addStock(id, qty);
  }

  @Patch(':id/reduce-stock')
  @Roles('ADMIN')
  async reduceStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) qty: number
  ) {
    return await this.stockCommand.reduceStock(id, qty);
  }
}
