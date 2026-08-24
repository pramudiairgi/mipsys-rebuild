import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './report.service';

@ApiTags('Finance')
@ApiBearerAuth('access-token')
@Controller('finance')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('reports/profit-loss')
  async profitLoss(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.reportService.getProfitLoss(startDate, endDate);
  }

  @Get('reports/tax/ppn')
  async ppnReport(@Query('year') year: number, @Query('month') month: number) {
    return this.reportService.getPpnReport(year, month);
  }

  @Get('dashboard')
  async dashboard() {
    return this.reportService.getDashboard();
  }
}
