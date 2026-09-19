import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { products } from './products';
import { marketplaces } from './marketplaces';

export const marketplaceLinks = pgTable(
  'marketplace_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    marketplaceId: uuid('marketplace_id').references(() => marketplaces.id, {
      onDelete: 'set null',
    }),
    marketplaceName: varchar('marketplace_name', { length: 100 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    productIdx: index('marketplace_links_product_id_idx').on(table.productId),
  }),
);
