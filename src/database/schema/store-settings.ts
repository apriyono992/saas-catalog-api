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
    bannerUrl: text('banner_url'),
    navbarColor: varchar('navbar_color', { length: 50 }),
    buttonColor: varchar('button_color', { length: 50 }),
    buttonTextColor: varchar('button_text_color', { length: 50 }),
    categoryTitle: varchar('category_title', { length: 255 }),
    cardColor: varchar('card_color', { length: 50 }),
    cardSectionColor: varchar('card_section_color', { length: 50 }),
    defaultStrikePercentage: varchar('default_strike_percentage', { length: 10 }).default('35'),
    storageDriver: varchar('storage_driver', { length: 20 }).default('local'),
    s3Endpoint: text('s3_endpoint'),
    s3Region: varchar('s3_region', { length: 50 }).default('auto'),
    s3Bucket: varchar('s3_bucket', { length: 255 }),
    s3AccessKeyId: text('s3_access_key_id'),
    s3SecretAccessKey: text('s3_secret_access_key'),
    s3PublicUrlBase: text('s3_public_url_base'),
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
