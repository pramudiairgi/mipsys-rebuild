import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { serviceRequests } from '../../database/schema';

@Injectable()
export class ServiceRequestStatsService {
  private readonly logger = new Logger(ServiceRequestStatsService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async getDashboardStats() {
    try {
      const allSR = await this.db.query.serviceRequests.findMany();

      const pending = allSR.filter(
        (s) =>
          s.statusService === 'WAITING_CHECK' ||
          s.statusService === 'WAITING_APPROVE'
      ).length;
      const inService = allSR.filter(
        (s) => s.statusService === 'SERVICE'
      ).length;
      const awaitingParts = allSR.filter(
        (s) => s.statusService === 'AWAITING_PARTS'
      ).length;
      const ready = allSR.filter((s) => s.statusService === 'DONE').length;
      const closed = allSR.filter((s) => s.statusSystem === 'CLOSED').length;
      const cancelled = allSR.filter(
        (s) => s.statusService === 'CANCEL'
      ).length;

      return {
        total: allSR.length,
        pending,
        inService,
        awaitingParts,
        ready,
        closed,
        cancelled,
      };
    } catch (error) {
      this.logger.error('[GET_STATS_ERROR]', error);
      return {
        total: 0,
        pending: 0,
        inService: 0,
        awaitingParts: 0,
        ready: 0,
        closed: 0,
        cancelled: 0,
      };
    }
  }
}
