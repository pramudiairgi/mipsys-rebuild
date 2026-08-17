import { Injectable, Inject, Logger } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { serviceLogs } from '../../database/schema';
import { DrizzleTx } from '../../database/types';

@Injectable()
export class ServiceRequestActivityService {
  private readonly logger = new Logger(ServiceRequestActivityService.name);

  constructor(
    @Inject('DB_CONNECTION') private db: NodePgDatabase<typeof schema>
  ) {}

  async getActivities() {
    try {
      const logs = await this.db
        .select({
          id: serviceLogs.id,
          action: serviceLogs.action,
          description: serviceLogs.description,
          createdAt: serviceLogs.createdAt,
          performedBy: serviceLogs.performedBy,
        })
        .from(serviceLogs)
        .limit(10)
        .orderBy(desc(serviceLogs.createdAt));

      return logs.map((log) => ({
        time: log.createdAt
          ? new Date(log.createdAt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        user: `Staff #${log.performedBy || '-'}`,
        task: log.description || log.action,
        status:
          log.action?.includes('DONE') || log.action?.includes('COMPLETED')
            ? 'DONE'
            : log.action?.includes('SERVICE')
              ? 'SERVICE'
              : 'PENDING',
      }));
    } catch (error) {
      this.logger.error('[GET_ACTIVITIES_ERROR]', error);
      return [];
    }
  }

  async addActivity(
    tx: DrizzleTx,
    serviceRequestId: number,
    action: string,
    description: string,
    performedBy: number | null
  ) {
    await tx.insert(serviceLogs).values({
      serviceRequestId,
      action,
      description,
      performedBy: performedBy ?? null,
    });
  }
}
