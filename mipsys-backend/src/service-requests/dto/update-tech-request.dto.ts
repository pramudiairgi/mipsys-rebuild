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

class HardwareCheckDto {
  @IsString() @IsOptional() phStatus!: string;
  @IsString() @IsOptional() mbStatus!: string;
  @IsString() @IsOptional() psStatus!: string;
  @IsString() @IsOptional() othersStatus!: string;
}

export class UpdateTechRequestDto {
  @IsInt({ message: 'ID Teknisi harus berupa angka (int)' })
  @IsNotEmpty()
  technicianFixId!: number;

  @IsString()
  @IsNotEmpty()
  remarksHistory!: string;

  // Kita tambahkan Service Fee di sini
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

  // Tambahkan Hardware Check Object
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
