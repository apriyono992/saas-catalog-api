import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { marketplaceLinks, products } from '../../../database/schema';

export interface CreateMarketplaceLinkData {
  marketplaceName: string;
  url: string;
}

export interface UpdateMarketplaceLinkData {
  marketplaceName?: string;
  url?: string;
}

@Injectable()
export class MarketplaceLinksRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** Joins through `products` to confirm the link actually belongs to this tenant. */
  async findByIdForTenant(id: string, tenantId: string) {
    const rows = await this.db
      .select({
        id: marketplaceLinks.id,
        productId: marketplaceLinks.productId,
        marketplaceName: marketplaceLinks.marketplaceName,
        url: marketplaceLinks.url,
      })
      .from(marketplaceLinks)
      .innerJoin(products, eq(marketplaceLinks.productId, products.id))
      .where(and(eq(marketplaceLinks.id, id), eq(products.tenantId, tenantId)))
      .limit(1);

    return rows[0];
  }

  findAllForProduct(productId: string) {
    return this.db.query.marketplaceLinks.findMany({
      where: eq(marketplaceLinks.productId, productId),
      orderBy: (link, { asc }) => [asc(link.sortOrder)],
    });
  }

  findByIdForProduct(id: string, productId: string) {
    return this.db.query.marketplaceLinks.findFirst({
      where: and(
        eq(marketplaceLinks.id, id),
        eq(marketplaceLinks.productId, productId),
      ),
    });
  }

  private async nextSortOrder(productId: string): Promise<number> {
    const result = await this.db
      .select({ max: sql<number | null>`max(${marketplaceLinks.sortOrder})` })
      .from(marketplaceLinks)
      .where(eq(marketplaceLinks.productId, productId));
    return (result[0]?.max ?? -1) + 1;
  }

  async create(productId: string, data: CreateMarketplaceLinkData) {
    const sortOrder = await this.nextSortOrder(productId);
    const [created] = await this.db
      .insert(marketplaceLinks)
      .values({ productId, ...data, sortOrder })
      .returning();
    return created;
  }

  async update(id: string, productId: string, data: UpdateMarketplaceLinkData) {
    const [updated] = await this.db
      .update(marketplaceLinks)
      .set(data)
      .where(
        and(
          eq(marketplaceLinks.id, id),
          eq(marketplaceLinks.productId, productId),
        ),
      )
      .returning();
    return updated;
  }

  delete(id: string, productId: string) {
    return this.db
      .delete(marketplaceLinks)
      .where(
        and(
          eq(marketplaceLinks.id, id),
          eq(marketplaceLinks.productId, productId),
        ),
      );
  }
}
