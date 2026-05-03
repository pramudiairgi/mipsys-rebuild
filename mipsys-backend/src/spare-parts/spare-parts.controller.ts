import {
  Controller,
  Query,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { SparePartsService } from './spare-parts.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';

@Controller('spare-parts')
export class SparePartsController {
  constructor(private readonly sparePartsService: SparePartsService) {}

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) return [];
    return await this.sparePartsService.search(query);
  }

  @Get()
  findAll() {
    return this.sparePartsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sparePartsService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateSparePartDto) {
    return this.sparePartsService.create(createDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateSparePartDto
  ) {
    return await this.sparePartsService.update(id, updateDto);
  }

  @Patch(':id/add-stock')
  async addStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity', ParseIntPipe) quantity: number
  ) {
    return await this.sparePartsService.addStock(id, quantity);
  }

  // Hapus barang
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.sparePartsService.remove(id);
  }
}
