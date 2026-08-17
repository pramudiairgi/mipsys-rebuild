import { Controller, Get, Patch, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  UpdatePpnRateDto,
  UpdateInvoicePrefixDto,
} from './dto/update-settings.dto';

@Controller('finance/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getAll() {
    return this.settingsService.getAll();
  }

  @Patch('ppn-rate')
  async updatePpnRate(@Body() dto: UpdatePpnRateDto) {
    return this.settingsService.updatePpnRate(dto.ppnRate);
  }

  @Patch('invoice-prefix')
  async updateInvoicePrefix(@Body() dto: UpdateInvoicePrefixDto) {
    return this.settingsService.updateInvoicePrefix(dto.invoicePrefix);
  }
}
