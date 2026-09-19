import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { products } from './products';
import { categories } from './categories';

export const productCategories = pgTable(
  'product_categories',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.productId, table.categoryId] }),
    productIdx: index('product_categories_product_id_idx').on(table.productId),
    categoryIdx: index('product_categories_category_id_idx').on(table.categoryId),
  }),
);
