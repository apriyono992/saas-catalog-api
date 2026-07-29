import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import { activityLogs } from '../../database/schema';

export interface CreateActivityLogData {
  tenantId: string | null;
  userId: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: unknown;
}

export interface FindAllForTenantParams {
  page: number;
  limit: number;
}

@Injectable()
export class ActivityLogRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async create(data: CreateActivityLogData) {
    await this.db.insert(activityLogs).values(data);
  }

  async findAllForTenant(
    tenantId: string,
    { page, limit }: FindAllForTenantParams,
  ) {
    const where = eq(activityLogs.tenantId, tenantId);

    const [items, countResult] = await Promise.all([
      this.db.query.activityLogs.findMany({
        where,
        with: { user: { columns: { id: true, email: true } } },
        orderBy: (log, { desc }) => [desc(log.createdAt)],
        limit,
        offset: (page - 1) * limit,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(activityLogs)
        .where(where),
    ]);

    return { items, total: countResult[0].count };
  }
}
