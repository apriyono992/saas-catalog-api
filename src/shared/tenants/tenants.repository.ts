import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import { domains, storeSettings, tenants } from '../../database/schema';

@Injectable()
export class TenantsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** Every tenant gets an (initially empty) store_settings row, so GET /store never has to handle a missing one. */
  async create(name: string, hostname?: string) {
    return this.db.transaction(async (tx) => {
      const [created] = await tx.insert(tenants).values({ name }).returning();
      await tx.insert(storeSettings).values({ tenantId: created.id });
      if (hostname) {
        await tx
          .insert(domains)
          .values({ tenantId: created.id, hostname: hostname.trim().toLowerCase(), isPrimary: true });
      }
      return created;
    });
  }

  findById(id: string) {
    return this.db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });
  }

  findAll() {
    return this.db.query.tenants.findMany();
  }

  async updateName(id: string, name: string) {
    const [updated] = await this.db
      .update(tenants)
      .set({ name, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  }

  async updateStatus(id: string, status: 'active' | 'suspended') {
    const [updated] = await this.db
      .update(tenants)
      .set({ status, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  }
}
