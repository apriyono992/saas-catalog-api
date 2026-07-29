import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../../database/database.providers';
import type { Database } from '../../../database/database.providers';
import { productImages } from '../../../database/schema';

@Injectable()
export class ProductImagesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async nextSortOrder(productId: string): Promise<number> {
    const result = await this.db
      .select({ max: sql<number | null>`max(${productImages.sortOrder})` })
      .from(productImages)
      .where(eq(productImages.productId, productId));
    return (result[0]?.max ?? -1) + 1;
  }

  async create(productId: string, url: string, sortOrder: number) {
    const [created] = await this.db
      .insert(productImages)
      .values({ productId, url, sortOrder })
      .returning();
    return created;
  }

  findByIdForProduct(id: string, productId: string) {
    return this.db.query.productImages.findFirst({
      where: and(
        eq(productImages.id, id),
        eq(productImages.productId, productId),
      ),
    });
  }

  delete(id: string) {
    return this.db.delete(productImages).where(eq(productImages.id, id));
  }

  async reorder(productId: string, orderedIds: string[]) {
    await this.db.transaction(async (tx) => {
      for (const [index, id] of orderedIds.entries()) {
        await tx
          .update(productImages)
          .set({ sortOrder: index })
          .where(
            and(
              eq(productImages.id, id),
              eq(productImages.productId, productId),
            ),
          );
      }
    });
  }
}
