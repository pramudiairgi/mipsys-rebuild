import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryModelDto } from './create-category-model.dto';

export class UpdateCategoryModelDto extends PartialType(
  CreateCategoryModelDto
) {}
