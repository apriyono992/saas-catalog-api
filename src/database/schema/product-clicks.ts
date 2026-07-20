import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { products } from './products';
import { marketplaceLinks } from './marketplace-links';

export const productClicks = pgTable(
  'product_clicks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    marketplaceLinkId: uuid('marketplace_link_id')
      .notNull()
      .references(() => marketplaceLinks.id, { onDelete: 'cascade' }),
    ipHash: varchar('ip_hash', { length: 64 }),
    userAgent: varchar('user_agent', { length: 255 }),
    clickedAt: timestamp('clicked_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantClickedAtIdx: index('product_clicks_tenant_id_clicked_at_idx').on(
      table.tenantId,
      table.clickedAt,
    ),
    productIdx: index('product_clicks_product_id_idx').on(table.productId),
    marketplaceLinkIdx: index('product_clicks_marketplace_link_id_idx').on(
      table.marketplaceLinkId,
    ),
  }),
);
