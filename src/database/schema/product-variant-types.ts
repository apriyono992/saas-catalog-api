import { pgTable, uuid, varchar, integer, index } from 'drizzle-orm/pg-core';
import { products } from './products';

export const productVariantTypes = pgTable(
  'product_variant_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    productIdx: index('product_variant_types_product_id_idx').on(
      table.productId,
    ),
  }),
);
