import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { categories } from '../../../database/schema';
import { TenantScopedRepository } from '../../../database/tenant-scoped.repository';

export interface CreateCategoryData {
  name: string;
  slug: string;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
}

@Injectable()
export class CategoriesRepository extends TenantScopedRepository<
  typeof categories
> {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, categories);
  }

  findAllForTenant(tenantId: string) {
    return this.db.query.categories.findMany({
      where: this.tenantScope(tenantId),
      orderBy: (category, { asc }) => [asc(category.name)],
    });
  }

  findBySlugForTenant(tenantId: string, slug: string) {
    return this.db.query.categories.findFirst({
      where: this.tenantScope(tenantId, eq(categories.slug, slug)),
    });
  }

  findByIdForTenant(tenantId: string, id: string) {
    return this.db.query.categories.findFirst({
      where: this.tenantScope(tenantId, eq(categories.id, id)),
    });
  }

  async existsBySlug(tenantId: string, slug: string): Promise<boolean> {
    const result = await this.db.query.categories.findFirst({
      where: this.tenantScope(tenantId, eq(categories.slug, slug)),
      columns: { id: true },
    });
    return !!result;
  }

  async create(tenantId: string, data: CreateCategoryData) {
    const [created] = await this.db
      .insert(categories)
      .values({ tenantId, ...data })
      .returning();
    return created;
  }

  async update(tenantId: string, id: string, data: UpdateCategoryData) {
    const [updated] = await this.db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(this.tenantScope(tenantId, eq(categories.id, id)))
      .returning();
    return updated;
  }

  async delete(tenantId: string, id: string) {
    const [deleted] = await this.db
      .delete(categories)
      .where(this.tenantScope(tenantId, eq(categories.id, id)))
      .returning();
    return deleted;
  }
}
