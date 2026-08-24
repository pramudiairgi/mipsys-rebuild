import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryReadService } from './inventory-read.service';
import { StockCommandService } from './stock-command.service';
import { StockMovementsService } from '../stock-movements/stock-movements.service';
import { ReserveStockDto } from './dto/reserve-stock.dto';

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly readService: InventoryReadService,
    private readonly stockCommand: StockCommandService,
    private readonly stockMovementsService: StockMovementsService
  ) {}

  @Get('parts')
  async getParts(
    @Query('search') search?: string,
    @Query('status') status?: 'ok' | 'low' | 'empty'
  ) {
    return this.readService.getParts({ search, status });
  }

  @Get('parts/search')
  async searchParts(@Query('q') query: string) {
    return this.readService.searchParts(query);
  }

  @Get('parts/:id')
  async getPart(@Param('id', ParseIntPipe) id: number) {
    return this.readService.getPartById(id);
  }

  @Get('parts/:id/movements')
  async getMovements(@Param('id', ParseIntPipe) id: number) {
    return this.stockMovementsService.getMovementsByPart(id);
  }

  @Post('parts/:id/reserve')
  async reserveStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReserveStockDto
  ) {
    return this.stockCommand.reserveStock(
      id,
      dto.quantity,
      dto.srTicketNumber,
      dto.performedBy
    );
  }

  @Get('models')
  async getModels() {
    return this.readService.getModels();
  }

  @Get('low-stock-alert')
  async getLowStockAlert() {
    return this.readService.getLowStockAlert();
  }
}
