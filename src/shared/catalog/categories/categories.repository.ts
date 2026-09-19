import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { categories } from '../../../database/schema';
import { TenantScopedRepository } from '../../../database/tenant-scoped.repository';

export interface CreateCategoryData {
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  imageUrl?: string | null;
  parentId?: string | null;
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
      with: {
        parent: true,
        children: true,
      },
      orderBy: (category, { asc }) => [asc(category.name)],
    });
  }

  findRootsForTenant(tenantId: string) {
    return this.db.query.categories.findMany({
      where: this.tenantScope(tenantId, isNull(categories.parentId)),
      with: {
        children: true,
      },
      orderBy: (category, { asc }) => [asc(category.name)],
    });
  }

  findChildrenForTenant(tenantId: string, parentId: string) {
    return this.db.query.categories.findMany({
      where: this.tenantScope(tenantId, eq(categories.parentId, parentId)),
      with: {
        children: true,
      },
      orderBy: (category, { asc }) => [asc(category.name)],
    });
  }

  findBySlugForTenant(tenantId: string, slug: string) {
    return this.db.query.categories.findFirst({
      where: this.tenantScope(tenantId, eq(categories.slug, slug)),
      with: {
        parent: true,
        children: true,
      },
    });
  }

  findByIdForTenant(tenantId: string, id: string) {
    return this.db.query.categories.findFirst({
      where: this.tenantScope(tenantId, eq(categories.id, id)),
      with: {
        parent: true,
        children: true,
      },
    });
  }

  async existsBySlug(tenantId: string, slug: string): Promise<boolean> {
    const result = await this.db.query.categories.findFirst({
      where: this.tenantScope(tenantId, eq(categories.slug, slug)),
      columns: { id: true },
    });
    return !!result;
  }

  /** Calculates depth level (1 for root, 2 for direct child, up to 5). */
  async getCategoryDepth(tenantId: string, categoryId: string): Promise<number> {
    let depth = 1;
    let currentId: string | null = categoryId;

    while (currentId && depth <= 10) {
      const cat = await this.db.query.categories.findFirst({
        where: this.tenantScope(tenantId, eq(categories.id, currentId)),
        columns: { parentId: true },
      });
      if (!cat || !cat.parentId) break;
      depth++;
      currentId = cat.parentId;
    }

    return depth;
  }

  /** Returns ancestor chain from root down to parent. */
  async getAncestors(
    tenantId: string,
    categoryId: string,
  ): Promise<{ id: string; name: string; slug: string }[]> {
    const ancestors: { id: string; name: string; slug: string }[] = [];
    let current = await this.db.query.categories.findFirst({
      where: this.tenantScope(tenantId, eq(categories.id, categoryId)),
      columns: { parentId: true },
    });

    while (current && current.parentId) {
      const parent = await this.db.query.categories.findFirst({
        where: this.tenantScope(tenantId, eq(categories.id, current.parentId)),
        columns: { id: true, name: true, slug: true, parentId: true },
      });
      if (!parent) break;
      ancestors.unshift({ id: parent.id, name: parent.name, slug: parent.slug });
      current = parent;
    }

    return ancestors;
  }

  /** Recursively gets category ID and all its descendants' IDs. */
  async getDescendantCategoryIds(
    tenantId: string,
    categoryId: string,
  ): Promise<string[]> {
    const result = [categoryId];
    let toCheck = [categoryId];

    while (toCheck.length > 0) {
      const children = await this.db.query.categories.findMany({
        where: this.tenantScope(tenantId, inArray(categories.parentId, toCheck)),
        columns: { id: true },
      });
      if (children.length === 0) break;
      const childIds = children.map((c) => c.id);
      result.push(...childIds);
      toCheck = childIds;
    }

    return result;
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

  async getProductCountsForTenant(
    tenantId: string,
    onlyPublished = true,
  ): Promise<Map<string, number>> {
    const statusFilter = onlyPublished ? sql`AND p.status = 'published'` : sql``;
    const query = sql`
      WITH RECURSIVE cat_tree(root_id, descendant_id) AS (
        SELECT id, id
        FROM categories
        WHERE tenant_id = ${tenantId}
        UNION ALL
        SELECT ct.root_id, c.id
        FROM categories c
        JOIN cat_tree ct ON c.parent_id = ct.descendant_id
        WHERE c.tenant_id = ${tenantId}
      ),
      prod_assignments AS (
        SELECT p.id as product_id, p.category_id as category_id
        FROM products p
        WHERE p.tenant_id = ${tenantId} AND p.deleted_at IS NULL ${statusFilter}
        UNION
        SELECT pc.product_id, pc.category_id
        FROM product_categories pc
        JOIN products p ON p.id = pc.product_id
        WHERE p.tenant_id = ${tenantId} AND p.deleted_at IS NULL ${statusFilter}
      )
      SELECT 
        c.id,
        COUNT(DISTINCT pa.product_id)::int as product_count
      FROM categories c
      LEFT JOIN cat_tree ct ON ct.root_id = c.id
      LEFT JOIN prod_assignments pa ON pa.category_id = ct.descendant_id
      WHERE c.tenant_id = ${tenantId}
      GROUP BY c.id;
    `;

    const res = await this.db.execute<{ id: string; product_count: number }>(query);
    const map = new Map<string, number>();
    for (const row of res.rows) {
      map.set(row.id, Number(row.product_count));
    }
    return map;
  }
}
