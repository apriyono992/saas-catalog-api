import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const storeSettings = pgTable(
  'store_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    description: text('description'),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    socialInstagram: varchar('social_instagram', { length: 255 }),
    socialFacebook: varchar('social_facebook', { length: 255 }),
    socialTiktok: varchar('social_tiktok', { length: 255 }),
    socialWhatsapp: varchar('social_whatsapp', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdUnique: uniqueIndex('store_settings_tenant_id_unique').on(
      table.tenantId,
    ),
  }),
);
