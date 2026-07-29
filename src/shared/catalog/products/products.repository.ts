import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, ne, sql, SQL } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { products } from '../../../database/schema';
import { TenantScopedRepository } from '../../../database/tenant-scoped.repository';

export interface FindPublishedListParams {
  page: number;
  limit: number;
  categoryId?: string;
  search?: string;
}

@Injectable()
export class ProductsRepository extends TenantScopedRepository<
  typeof products
> {
  constructor(@Inject(DATABASE_CONNECTION) db: Database) {
    super(db, products);
  }

  async findPublishedList(
    tenantId: string,
    { page, limit, categoryId, search }: FindPublishedListParams,
  ) {
    const filters: SQL[] = [eq(products.status, 'published')];
    if (categoryId) {
      filters.push(eq(products.categoryId, categoryId));
    }
    if (search) {
      filters.push(ilike(products.name, `%${search}%`));
    }

    const where = this.tenantScope(tenantId, and(...filters));

    const [items, countResult] = await Promise.all([
      this.db.query.products.findMany({
        where,
        with: {
          images: { orderBy: (image, { asc }) => [asc(image.sortOrder)] },
          category: true,
        },
        orderBy: (product, { desc }) => [desc(product.createdAt)],
        limit,
        offset: (page - 1) * limit,
      }),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(where),
    ]);

    return { items, total: countResult[0].count };
  }

  findPublishedBySlug(tenantId: string, slug: string) {
    return this.db.query.products.findFirst({
      where: this.tenantScope(
        tenantId,
        and(eq(products.slug, slug), eq(products.status, 'published')),
      ),
      with: {
        images: { orderBy: (image, { asc }) => [asc(image.sortOrder)] },
        category: true,
        variantTypes: {
          orderBy: (variantType, { asc }) => [asc(variantType.sortOrder)],
          with: {
            options: {
              orderBy: (option, { asc }) => [asc(option.sortOrder)],
            },
          },
        },
        marketplaceLinks: {
          orderBy: (link, { asc }) => [asc(link.sortOrder)],
        },
      },
    });
  }

  findRelated(
    tenantId: string,
    categoryId: string,
    excludeProductId: string,
    limit: number,
  ) {
    return this.db.query.products.findMany({
      where: this.tenantScope(
        tenantId,
        and(
          eq(products.status, 'published'),
          eq(products.categoryId, categoryId),
          ne(products.id, excludeProductId),
        ),
      ),
      with: {
        images: { orderBy: (image, { asc }) => [asc(image.sortOrder)] },
        category: true,
      },
      orderBy: (product, { desc }) => [desc(product.createdAt)],
      limit,
    });
  }
}
