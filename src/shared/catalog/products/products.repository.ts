import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, inArray, ne, sql, SQL } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { products } from '../../../database/schema';
import { TenantScopedRepository } from '../../../database/tenant-scoped.repository';

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface FindPublishedListParams {
  page: number;
  limit: number;
  categoryId?: string;
  search?: string;
}

export interface FindAllForTenantParams {
  page: number;
  limit: number;
  status?: ProductStatus;
  search?: string;
}

export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  categoryId?: string | null;
  basePrice?: string;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string | null;
  categoryId?: string | null;
  basePrice?: string;
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

  findManyByIdsForTenant(tenantId: string, ids: string[]) {
    return this.db.query.products.findMany({
      where: this.tenantScope(
        tenantId,
        and(eq(products.status, 'published'), inArray(products.id, ids)),
      ),
      with: {
        images: { orderBy: (image, { asc }) => [asc(image.sortOrder)] },
        category: true,
      },
    });
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

  async findAllForTenant(
    tenantId: string,
    { page, limit, status, search }: FindAllForTenantParams,
  ) {
    const filters: SQL[] = [];
    if (status) {
      filters.push(eq(products.status, status));
    }
    if (search) {
      filters.push(ilike(products.name, `%${search}%`));
    }

    const where = this.tenantScope(
      tenantId,
      filters.length ? and(...filters) : undefined,
    );

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

  findByIdForTenant(tenantId: string, id: string) {
    return this.db.query.products.findFirst({
      where: this.tenantScope(tenantId, eq(products.id, id)),
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

  async existsBySlug(tenantId: string, slug: string): Promise<boolean> {
    const result = await this.db.query.products.findFirst({
      where: this.tenantScope(tenantId, eq(products.slug, slug)),
      columns: { id: true },
    });
    return !!result;
  }

  async create(tenantId: string, data: CreateProductData) {
    const [created] = await this.db
      .insert(products)
      .values({ tenantId, ...data })
      .returning();
    return created;
  }

  async update(tenantId: string, id: string, data: UpdateProductData) {
    const [updated] = await this.db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(this.tenantScope(tenantId, eq(products.id, id)))
      .returning();
    return updated;
  }

  async updateStatus(tenantId: string, id: string, status: ProductStatus) {
    const [updated] = await this.db
      .update(products)
      .set({ status, updatedAt: new Date() })
      .where(this.tenantScope(tenantId, eq(products.id, id)))
      .returning();
    return updated;
  }

  async delete(tenantId: string, id: string) {
    const [deleted] = await this.db
      .delete(products)
      .where(this.tenantScope(tenantId, eq(products.id, id)))
      .returning();
    return deleted;
  }
}
