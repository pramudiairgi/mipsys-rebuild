import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { CategoryModelsService } from './category-models.service';
import { CreateCategoryModelDto } from './dto/create-category-model.dto';
import { UpdateCategoryModelDto } from './dto/update-category-model.dto';

@ApiTags('Category Models')
@ApiBearerAuth('access-token')
@Controller('category-models')
export class CategoryModelsController {
  constructor(private readonly service: CategoryModelsService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCategoryModelDto) {
    return this.service.create(dto.name, dto.description);
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryModelDto
  ) {
    return this.service.update(id, dto.name!, dto.description);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
