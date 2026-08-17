import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql, SQL } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import {
  marketplaceLinks,
  productClicks,
  products,
} from '../../database/schema';

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

@Injectable()
export class ProductClicksRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async countTotal(tenantId: string, range: DateRangeFilter): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(productClicks)
      .where(this.buildWhere(tenantId, range));
    return result[0].count;
  }

  countByProduct(tenantId: string, range: DateRangeFilter) {
    return this.db
      .select({
        productId: productClicks.productId,
        productName: products.name,
        productSlug: products.slug,
        count: sql<number>`count(*)::int`,
      })
      .from(productClicks)
      .innerJoin(products, eq(productClicks.productId, products.id))
      .where(this.buildWhere(tenantId, range))
      .groupBy(productClicks.productId, products.name, products.slug)
      .orderBy(desc(sql`count(*)`));
  }

  countTopByProduct(tenantId: string, limit: number) {
    return this.db
      .select({
        productId: productClicks.productId,
        count: sql<number>`count(*)::int`,
      })
      .from(productClicks)
      .innerJoin(products, eq(productClicks.productId, products.id))
      .where(
        and(
          eq(productClicks.tenantId, tenantId),
          eq(products.status, 'published'),
        ),
      )
      .groupBy(productClicks.productId)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);
  }

  countByMarketplace(tenantId: string, range: DateRangeFilter) {
    return this.db
      .select({
        marketplaceName: marketplaceLinks.marketplaceName,
        count: sql<number>`count(*)::int`,
      })
      .from(productClicks)
      .innerJoin(
        marketplaceLinks,
        eq(productClicks.marketplaceLinkId, marketplaceLinks.id),
      )
      .where(this.buildWhere(tenantId, range))
      .groupBy(marketplaceLinks.marketplaceName)
      .orderBy(desc(sql`count(*)`));
  }

  private buildWhere(tenantId: string, { from, to }: DateRangeFilter): SQL {
    const filters = [eq(productClicks.tenantId, tenantId)];
    if (from) {
      filters.push(gte(productClicks.clickedAt, from));
    }
    if (to) {
      filters.push(lte(productClicks.clickedAt, to));
    }
    return and(...filters)!;
  }
}
