import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { categories } from '../../../database/schema';
import { TenantScopedRepository } from '../../../database/tenant-scoped.repository';

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
}
