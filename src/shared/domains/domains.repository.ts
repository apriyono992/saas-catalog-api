import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import { domains } from '../../database/schema';
import { TenantScopedRepository } from '../../database/tenant-scoped.repository';

@Injectable()
export class DomainsRepository extends TenantScopedRepository<typeof domains> {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, domains);
  }

  /** Global lookup by hostname, used by tenant resolution (not tenant-scoped by design). */
  findByHostname(hostname: string) {
    return this.db.query.domains.findFirst({
      where: eq(domains.hostname, hostname),
    });
  }

  findAllForTenant(tenantId: string) {
    return this.db.query.domains.findMany({
      where: this.tenantScope(tenantId),
    });
  }

  findByIdForTenant(id: string, tenantId: string) {
    return this.db.query.domains.findFirst({
      where: this.tenantScope(tenantId, eq(domains.id, id)),
    });
  }

  async create(tenantId: string, hostname: string, isPrimary = false) {
    const [created] = await this.db
      .insert(domains)
      .values({ tenantId, hostname, isPrimary })
      .returning();
    return created;
  }

  async delete(id: string, tenantId: string) {
    const [deleted] = await this.db
      .delete(domains)
      .where(this.tenantScope(tenantId, eq(domains.id, id)))
      .returning();
    return deleted;
  }

  async verify(id: string, tenantId: string) {
    const [verified] = await this.db
      .update(domains)
      .set({ verifiedAt: new Date() })
      .where(this.tenantScope(tenantId, eq(domains.id, id)))
      .returning();
    return verified;
  }
}
