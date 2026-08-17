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
import { InventoryReadService } from './inventory-read.service';
import { InventoryWriteService } from './inventory-write.service';
import { StockCommandService } from './stock-command.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

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
  async create(@Body() dto: CreateSparePartDto) {
    return await this.writeService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSparePartDto
  ) {
    return await this.writeService.update(id, dto);
  }

  @Patch(':id/add-stock')
  async addStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) qty: number
  ) {
    return await this.stockCommand.addStock(id, qty);
  }

  @Patch(':id/reduce-stock')
  async reduceStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) qty: number
  ) {
    return await this.stockCommand.reduceStock(id, qty);
  }
}
