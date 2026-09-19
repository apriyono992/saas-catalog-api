import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { marketplaces } from '../../../database/schema';

export interface CreateMarketplaceData {
  name: string;
  slug: string;
  iconUrl?: string | null;
  isDefault?: boolean;
}

export interface UpdateMarketplaceData {
  name?: string;
  slug?: string;
  iconUrl?: string | null;
}

@Injectable()
export class MarketplacesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  findAll() {
    return this.db.query.marketplaces.findMany({
      orderBy: (m, { asc }) => [asc(m.name)],
    });
  }

  findById(id: string) {
    return this.db.query.marketplaces.findFirst({
      where: eq(marketplaces.id, id),
    });
  }

  findBySlug(slug: string) {
    return this.db.query.marketplaces.findFirst({
      where: eq(marketplaces.slug, slug),
    });
  }

  async create(data: CreateMarketplaceData) {
    const [created] = await this.db
      .insert(marketplaces)
      .values(data)
      .returning();
    return created;
  }

  async update(id: string, data: UpdateMarketplaceData) {
    const [updated] = await this.db
      .update(marketplaces)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(marketplaces.id, id))
      .returning();
    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.db
      .delete(marketplaces)
      .where(eq(marketplaces.id, id))
      .returning();
    return deleted;
  }
}
