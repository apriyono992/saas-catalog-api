import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ilike, inArray, isNull, ne, sql, SQL } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { productCategories, products } from '../../../database/schema';
import { TenantScopedRepository } from '../../../database/tenant-scoped.repository';

export type ProductStatus = 'draft' | 'published' | 'archived';

export interface FindPublishedListParams {
  page: number;
  limit: number;
  categoryId?: string;
  categoryIds?: string[];
  search?: string;
}

export interface FindAllForTenantParams {
  page: number;
  limit: number;
  status?: ProductStatus;
  search?: string;
  categoryId?: string;
  categoryIds?: string[];
}

export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  categoryId?: string | null;
  categoryIds?: string[];
  basePrice?: string;
  strikePrice?: string | null;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string | null;
  categoryId?: string | null;
  categoryIds?: string[];
  basePrice?: string;
  strikePrice?: string | null;
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
    { page, limit, categoryId, categoryIds, search }: FindPublishedListParams,
  ) {
    const filters: SQL[] = [eq(products.status, 'published'), isNull(products.deletedAt)];
    if (categoryIds && categoryIds.length > 0) {
      filters.push(
        sql`(${products.categoryId} IN (${sql.join(categoryIds.map(id => sql`${id}`), sql`, `)}) OR EXISTS (
          SELECT 1 FROM product_categories
          WHERE product_categories.product_id = ${products.id}
          AND product_categories.category_id IN (${sql.join(categoryIds.map(id => sql`${id}`), sql`, `)})
        ))`
      );
    } else if (categoryId) {
      filters.push(
        sql`(${products.categoryId} = ${categoryId} OR EXISTS (
          SELECT 1 FROM product_categories
          WHERE product_categories.product_id = ${products.id}
          AND product_categories.category_id = ${categoryId}
        ))`
      );
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
        and(
          eq(products.status, 'published'),
          inArray(products.id, ids),
          isNull(products.deletedAt),
        ),
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
        and(
          eq(products.slug, slug),
          eq(products.status, 'published'),
          isNull(products.deletedAt),
        ),
      ),
      with: {
        images: { orderBy: (image, { asc }) => [asc(image.sortOrder)] },
        category: true,
        productCategories: {
          with: {
            category: true,
          },
        },
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
          with: {
            marketplace: true,
          },
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
          isNull(products.deletedAt),
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
    { page, limit, status, search, categoryId, categoryIds }: FindAllForTenantParams,
  ) {
    const filters: SQL[] = [isNull(products.deletedAt)];
    if (status) {
      filters.push(eq(products.status, status));
    }
    if (search) {
      filters.push(ilike(products.name, `%${search}%`));
    }
    if (categoryIds && categoryIds.length > 0) {
      filters.push(
        sql`(${products.categoryId} IN (${sql.join(categoryIds.map(id => sql`${id}`), sql`, `)}) OR EXISTS (
          SELECT 1 FROM product_categories
          WHERE product_categories.product_id = ${products.id}
          AND product_categories.category_id IN (${sql.join(categoryIds.map(id => sql`${id}`), sql`, `)})
        ))`
      );
    } else if (categoryId) {
      filters.push(
        sql`(${products.categoryId} = ${categoryId} OR EXISTS (
          SELECT 1 FROM product_categories
          WHERE product_categories.product_id = ${products.id}
          AND product_categories.category_id = ${categoryId}
        ))`
      );
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

  findByIdForTenant(tenantId: string, id: string) {
    return this.db.query.products.findFirst({
      where: this.tenantScope(tenantId, and(eq(products.id, id), isNull(products.deletedAt))),
      with: {
        images: { orderBy: (image, { asc }) => [asc(image.sortOrder)] },
        category: true,
        productCategories: {
          with: {
            category: true,
          },
        },
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
          with: {
            marketplace: true,
          },
        },
      },
    });
  }

  async existsBySlug(tenantId: string, slug: string): Promise<boolean> {
    const result = await this.db.query.products.findFirst({
      where: this.tenantScope(tenantId, and(eq(products.slug, slug), isNull(products.deletedAt))),
      columns: { id: true },
    });
    return !!result;
  }

  async create(tenantId: string, data: CreateProductData) {
    const { categoryIds, ...productValues } = data;
    const [created] = await this.db
      .insert(products)
      .values({ tenantId, ...productValues })
      .returning();

    if (categoryIds && categoryIds.length > 0) {
      await this.db
        .insert(productCategories)
        .values(
          categoryIds.map((cId) => ({
            productId: created.id,
            categoryId: cId,
          })),
        )
        .onConflictDoNothing();
    }
    return created;
  }

  async update(tenantId: string, id: string, data: UpdateProductData) {
    const { categoryIds, ...productValues } = data;
    const [updated] = await this.db
      .update(products)
      .set({ ...productValues, updatedAt: new Date() })
      .where(this.tenantScope(tenantId, eq(products.id, id)))
      .returning();

    if (categoryIds !== undefined) {
      await this.db
        .delete(productCategories)
        .where(eq(productCategories.productId, id));

      if (categoryIds.length > 0) {
        await this.db
          .insert(productCategories)
          .values(
            categoryIds.map((cId) => ({
              productId: id,
              categoryId: cId,
            })),
          )
          .onConflictDoNothing();
      }
    }
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
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(this.tenantScope(tenantId, and(eq(products.id, id), isNull(products.deletedAt))))
      .returning();
    return deleted;
  }
}
