import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references((): any => categories.id, {
      onDelete: 'cascade',
    }),
    name: varchar('name', { length: 150 }).notNull(),
    slug: varchar('slug', { length: 160 }).notNull(),
    imageUrl: varchar('image_url', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantSlugUnique: uniqueIndex('categories_tenant_id_slug_unique').on(
      table.tenantId,
      table.slug,
    ),
  }),
);
