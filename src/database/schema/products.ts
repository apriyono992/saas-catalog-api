import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { categories } from './categories';
import { productStatusEnum } from './enums';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 280 }).notNull(),
    description: text('description'),
    basePrice: numeric('base_price', { precision: 14, scale: 2 })
      .notNull()
      .default('0'),
    strikePrice: numeric('strike_price', { precision: 14, scale: 2 }),
    status: productStatusEnum('status').notNull().default('draft'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantSlugUnique: uniqueIndex('products_tenant_id_slug_unique').on(
      table.tenantId,
      table.slug,
    ),
    tenantStatusIdx: index('products_tenant_id_status_idx').on(
      table.tenantId,
      table.status,
    ),
    tenantCategoryIdx: index('products_tenant_id_category_id_idx').on(
      table.tenantId,
      table.categoryId,
    ),
    tenantDeletedIdx: index('products_tenant_id_deleted_at_idx').on(
      table.tenantId,
      table.deletedAt,
    ),
  }),
);
