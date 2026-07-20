import { pgTable, uuid, varchar, integer, index } from 'drizzle-orm/pg-core';
import { productVariantTypes } from './product-variant-types';

export const productVariantOptions = pgTable(
  'product_variant_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    variantTypeId: uuid('variant_type_id')
      .notNull()
      .references(() => productVariantTypes.id, { onDelete: 'cascade' }),
    value: varchar('value', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => ({
    variantTypeIdx: index('product_variant_options_variant_type_id_idx').on(
      table.variantTypeId,
    ),
  }),
);
