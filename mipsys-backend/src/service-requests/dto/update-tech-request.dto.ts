import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  ValidateNested,
  IsArray,
  IsEnum,
  IsObject,
} from 'class-validator';
import { PartItemDto } from './part-item.dto';
import { HardwareCheckDto } from './hardware-check.dto';

export class UpdateTechRequestDto {
  @IsInt({ message: 'ID Teknisi harus berupa angka (int)' })
  @IsNotEmpty()
  technicianCheckId!: number;

  @IsString()
  @IsNotEmpty()
  remarksHistory!: string;

  @IsString()
  @IsOptional()
  serviceFee?: string;

  @IsEnum(
    [
      'WAITING CHECK',
      'PENDING APPROVAL',
      'PENDING PART',
      'SERVICE',
      'DONE',
      'CANCEL',
    ],
    { message: 'Status tidak valid' }
  )
  @IsNotEmpty()
  statusService!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => HardwareCheckDto)
  hardwareCheck?: HardwareCheckDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartItemDto)
  parts?: PartItemDto[];
}
