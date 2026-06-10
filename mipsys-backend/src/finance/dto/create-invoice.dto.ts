import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum InvoiceStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  QRIS = 'QRIS',
}

export class CreateInvoiceDto {
  @IsString()
  ticketNumber!: string;

  @IsString()
  clientName!: string;

  @IsNumber()
  @Type(() => Number)
  serviceFee!: number;

  @IsNumber()
  @Type(() => Number)
  partFee!: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryInvoiceDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value === '' ? undefined : value))
  search?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  @Transform(({ value }) => (value === '' ? undefined : value))
  status?: InvoiceStatus;
}
