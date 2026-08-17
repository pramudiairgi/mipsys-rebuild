import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrderPartsModule } from '../order-parts/order-parts.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [DatabaseModule, OrderPartsModule],
  controllers: [
    FinanceController,
    ExpenseController,
    ReportController,
    SettingsController,
  ],
  providers: [FinanceService, ExpenseService, ReportService, SettingsService],
  exports: [FinanceService],
})
export class FinanceModule {}
