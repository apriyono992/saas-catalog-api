import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import { tenants } from '../../database/schema';

@Injectable()
export class TenantsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async create(name: string) {
    const [created] = await this.db
      .insert(tenants)
      .values({ name })
      .returning();
    return created;
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
