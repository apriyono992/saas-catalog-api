import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { productVariantTypes } from '../../../database/schema';

export interface UpdateVariantTypeData {
  name?: string;
  sortOrder?: number;
}

@Injectable()
export class ProductVariantTypesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  findAllForProduct(productId: string) {
    return this.db.query.productVariantTypes.findMany({
      where: eq(productVariantTypes.productId, productId),
      orderBy: (variantType, { asc }) => [asc(variantType.sortOrder)],
      with: {
        options: { orderBy: (option, { asc }) => [asc(option.sortOrder)] },
      },
    });
  }

  findByIdForProduct(id: string, productId: string) {
    return this.db.query.productVariantTypes.findFirst({
      where: and(
        eq(productVariantTypes.id, id),
        eq(productVariantTypes.productId, productId),
      ),
    });
  }

  private async nextSortOrder(productId: string): Promise<number> {
    const result = await this.db
      .select({
        max: sql<number | null>`max(${productVariantTypes.sortOrder})`,
      })
      .from(productVariantTypes)
      .where(eq(productVariantTypes.productId, productId));
    return (result[0]?.max ?? -1) + 1;
  }

  async create(productId: string, name: string) {
    const sortOrder = await this.nextSortOrder(productId);
    const [created] = await this.db
      .insert(productVariantTypes)
      .values({ productId, name, sortOrder })
      .returning();
    return created;
  }

  async update(id: string, productId: string, data: UpdateVariantTypeData) {
    const [updated] = await this.db
      .update(productVariantTypes)
      .set(data)
      .where(
        and(
          eq(productVariantTypes.id, id),
          eq(productVariantTypes.productId, productId),
        ),
      )
      .returning();
    return updated;
  }

  delete(id: string, productId: string) {
    return this.db
      .delete(productVariantTypes)
      .where(
        and(
          eq(productVariantTypes.id, id),
          eq(productVariantTypes.productId, productId),
        ),
      );
  }
}
