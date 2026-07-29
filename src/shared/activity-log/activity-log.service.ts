import { Injectable, Logger } from '@nestjs/common';
import { assertTenantScoped } from '../../common/utils/assert-tenant-scoped.util';
import {
  ActivityLogRepository,
  CreateActivityLogData,
} from './activity-log.repository';

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private readonly activityLogRepository: ActivityLogRepository) {}

  /** Best-effort: a logging failure must never break the request that triggered it. */
  async record(data: CreateActivityLogData): Promise<void> {
    try {
      await this.activityLogRepository.create(data);
    } catch (error) {
      this.logger.warn(
        `Failed to record activity log for action "${data.action}"`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  findAllForTenant(
    tenantId: string | null,
    options: { page: number; limit: number },
  ) {
    assertTenantScoped(tenantId);
    return this.activityLogRepository.findAllForTenant(tenantId, options);
  }
}
