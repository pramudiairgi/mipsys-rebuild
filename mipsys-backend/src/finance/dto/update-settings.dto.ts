import { IsString, IsNumber, Min, Max, IsIn, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePpnRateDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  ppnRate!: number;
}

export class UpdateInvoicePrefixDto {
  @IsString()
  invoicePrefix!: string;
}

export class UpdatePpnConfigDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  ppnRate!: number;

  @IsIn(['EXCLUSIVE', 'INCLUSIVE'])
  @IsOptional()
  ppnFormula?: string = 'EXCLUSIVE';

  @IsIn(['HALF_UP', 'HALF_EVEN', 'NONE'])
  @IsOptional()
  ppnRounding?: string = 'HALF_UP';

  @IsBoolean()
  @IsOptional()
  ppnInclusive?: boolean = false;
}
