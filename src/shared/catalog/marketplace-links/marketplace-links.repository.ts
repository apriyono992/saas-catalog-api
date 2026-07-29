import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { marketplaceLinks, products } from '../../../database/schema';

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
}
