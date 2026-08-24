import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrderPartsService } from './order-parts.service';
import { CreateOrderPartDto } from './dto/create-order-part.dto';

@ApiTags('Order Parts')
@ApiBearerAuth('access-token')
@Controller('order-parts')
export class OrderPartsController {
  constructor(private readonly orderPartsService: OrderPartsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addPart(@Body() dto: CreateOrderPartDto) {
    return this.orderPartsService.addPart(dto);
  }

  @Get('sr/:serviceRequestId')
  async getBySR(@Param('serviceRequestId', ParseIntPipe) id: number) {
    return this.orderPartsService.getByServiceRequest(id);
  }

  @Get('sr/:serviceRequestId/total-cost')
  async getTotalCost(@Param('serviceRequestId', ParseIntPipe) id: number) {
    const total = await this.orderPartsService.getTotalPartsCost(id);
    return { serviceRequestId: id, totalPartsCost: total };
  }

  @Delete(':id')
  async removePart(@Param('id', ParseIntPipe) id: number) {
    return this.orderPartsService.removePart(id);
  }
}
