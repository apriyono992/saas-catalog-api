import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { productVariantOptions } from '../../../database/schema';

export interface UpdateVariantOptionData {
  value?: string;
  sortOrder?: number;
}

@Injectable()
export class ProductVariantOptionsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  findAllForType(variantTypeId: string) {
    return this.db.query.productVariantOptions.findMany({
      where: eq(productVariantOptions.variantTypeId, variantTypeId),
      orderBy: (option, { asc }) => [asc(option.sortOrder)],
    });
  }

  findByIdForType(id: string, variantTypeId: string) {
    return this.db.query.productVariantOptions.findFirst({
      where: and(
        eq(productVariantOptions.id, id),
        eq(productVariantOptions.variantTypeId, variantTypeId),
      ),
    });
  }

  private async nextSortOrder(variantTypeId: string): Promise<number> {
    const result = await this.db
      .select({
        max: sql<number | null>`max(${productVariantOptions.sortOrder})`,
      })
      .from(productVariantOptions)
      .where(eq(productVariantOptions.variantTypeId, variantTypeId));
    return (result[0]?.max ?? -1) + 1;
  }

  async create(variantTypeId: string, value: string) {
    const sortOrder = await this.nextSortOrder(variantTypeId);
    const [created] = await this.db
      .insert(productVariantOptions)
      .values({ variantTypeId, value, sortOrder })
      .returning();
    return created;
  }

  async update(
    id: string,
    variantTypeId: string,
    data: UpdateVariantOptionData,
  ) {
    const [updated] = await this.db
      .update(productVariantOptions)
      .set(data)
      .where(
        and(
          eq(productVariantOptions.id, id),
          eq(productVariantOptions.variantTypeId, variantTypeId),
        ),
      )
      .returning();
    return updated;
  }

  delete(id: string, variantTypeId: string) {
    return this.db
      .delete(productVariantOptions)
      .where(
        and(
          eq(productVariantOptions.id, id),
          eq(productVariantOptions.variantTypeId, variantTypeId),
        ),
      );
  }
}
