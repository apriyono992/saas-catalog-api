import { and, eq, SQL } from 'drizzle-orm';
import { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { Database } from './database.providers';

/**
 * Base for repositories over tenant-scoped tables. `tenantScope` always
 * ANDs in `tenant_id = ?` so callers can't accidentally query across
 * tenants by forgetting the filter.
 */
export abstract class TenantScopedRepository<
  TTable extends PgTable & { tenantId: PgColumn },
> {
  protected constructor(
    protected readonly db: Database,
    protected readonly table: TTable,
  ) {}

  protected tenantScope(tenantId: string, extra?: SQL): SQL {
    const base = eq(this.table.tenantId, tenantId);
    return extra ? and(base, extra)! : base;
  }
}
