# SaaS Catalog — Database Schema (Drizzle ORM)

Status: Draft
Owner: Backend Team
Terakhir diupdate: 2026-07-20
Referensi: [`backend-mvp-plan.md`](./backend-mvp-plan.md) — section 6 (Data Model)

## 1. Konvensi

- **Primary key**: `uuid`, generate via `defaultRandom()` (Drizzle) → `gen_random_uuid()` di Postgres (native sejak PG 13+, tidak butuh extension tambahan).
- **Naming**: kolom TypeScript pakai `camelCase`, mapping ke kolom database `snake_case` (eksplisit di tiap definisi, mis. `tenantId: uuid('tenant_id')`).
- **Timestamp**: semua `timestamp` pakai `{ withTimezone: true }`, default `now()`. Tabel yang bisa berubah setelah dibuat punya `createdAt` + `updatedAt`; tabel append-only (log, klik) cukup `createdAt`.
- **Soft delete**: tidak dipakai di MVP. `products` sudah punya `status` (`draft` / `published` / `archived`) yang berfungsi sebagai "soft delete" secara fungsional. Delete keras hanya untuk child records (image, variant option, marketplace link).
- **Tenant isolation**: setiap tabel tenant-scoped **wajib** punya kolom `tenant_id` (langsung atau via denormalisasi untuk query analytics cepat, lihat `product_clicks`). Lihat helper isolasi query di section 6 `backend-mvp-plan.md`.
- **File organization**:
  ```
  src/database/
    schema/
      enums.ts
      tenants.ts
      domains.ts
      users.ts
      refresh-tokens.ts
      categories.ts
      products.ts
      product-images.ts
      product-variant-types.ts
      product-variant-options.ts
      marketplace-links.ts
      product-clicks.ts
      activity-logs.ts
      relations.ts
      index.ts        // barrel export semua schema + relations
    migrations/        // hasil generate drizzle-kit, jangan diedit manual
  drizzle.config.ts
  ```

## 2. Enums

```typescript
// src/database/schema/enums.ts
import { pgEnum } from 'drizzle-orm/pg-core';

export const tenantStatusEnum = pgEnum('tenant_status', ['active', 'suspended']);
export const userRoleEnum = pgEnum('user_role', ['superadmin', 'admin']);
export const productStatusEnum = pgEnum('product_status', ['draft', 'published', 'archived']);
```

## 3. Tenant & Domain

```typescript
// src/database/schema/tenants.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { tenantStatusEnum } from './enums';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  status: tenantStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

```typescript
// src/database/schema/domains.ts
import { pgTable, uuid, varchar, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  hostname: varchar('hostname', { length: 255 }).notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  hostnameUnique: uniqueIndex('domains_hostname_unique').on(table.hostname),
  tenantIdx: index('domains_tenant_id_idx').on(table.tenantId),
}));
```

> `hostname` disimpan lowercase (normalisasi di application layer sebelum insert) supaya lookup dari `Host` header (juga di-lowercase) konsisten.

## 4. Auth & User

```typescript
// src/database/schema/users.ts
import { pgTable, uuid, varchar, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { userRoleEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // null untuk superadmin
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('admin'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailUnique: uniqueIndex('users_email_unique').on(table.email),
  tenantIdx: index('users_tenant_id_idx').on(table.tenantId),
}));
```

```typescript
// src/database/schema/refresh-tokens.ts
import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('refresh_tokens_user_id_idx').on(table.userId),
}));
```

> `email` unik secara global (bukan per-tenant) supaya login tidak butuh input tenant tambahan — admin login langsung dengan email+password, tenant di-derive dari data user. Refresh token disimpan sebagai **hash** (bukan token mentah), sama seperti password.

## 5. Catalog: Category, Product, Image, Variant

```typescript
// src/database/schema/categories.ts
import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 160 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantSlugUnique: uniqueIndex('categories_tenant_id_slug_unique').on(table.tenantId, table.slug),
}));
```

```typescript
// src/database/schema/products.ts
import { pgTable, uuid, varchar, text, numeric, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { categories } from './categories';
import { productStatusEnum } from './enums';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 280 }).notNull(),
  description: text('description'),
  basePrice: numeric('base_price', { precision: 14, scale: 2 }).notNull().default('0'),
  status: productStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantSlugUnique: uniqueIndex('products_tenant_id_slug_unique').on(table.tenantId, table.slug),
  tenantStatusIdx: index('products_tenant_id_status_idx').on(table.tenantId, table.status),
  tenantCategoryIdx: index('products_tenant_id_category_id_idx').on(table.tenantId, table.categoryId),
}));
```

```typescript
// src/database/schema/product-images.ts
import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { products } from './products';

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIdx: index('product_images_product_id_idx').on(table.productId),
}));
```

```typescript
// src/database/schema/product-variant-types.ts
import { pgTable, uuid, varchar, integer, index } from 'drizzle-orm/pg-core';
import { products } from './products';

export const productVariantTypes = pgTable('product_variant_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // mis. "Ukuran", "Warna", "Jenis"
  sortOrder: integer('sort_order').notNull().default(0),
}, (table) => ({
  productIdx: index('product_variant_types_product_id_idx').on(table.productId),
}));
```

```typescript
// src/database/schema/product-variant-options.ts
import { pgTable, uuid, varchar, integer, index } from 'drizzle-orm/pg-core';
import { productVariantTypes } from './product-variant-types';

export const productVariantOptions = pgTable('product_variant_options', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantTypeId: uuid('variant_type_id').notNull().references(() => productVariantTypes.id, { onDelete: 'cascade' }),
  value: varchar('value', { length: 100 }).notNull(), // mis. "S", "M", "L" / "Merah", "Biru"
  sortOrder: integer('sort_order').notNull().default(0),
}, (table) => ({
  variantTypeIdx: index('product_variant_options_variant_type_id_idx').on(table.variantTypeId),
}));
```

> Varian **tidak** punya harga/stok sendiri (lihat catatan di `backend-mvp-plan.md` section 6) — hanya dua level `type → option` untuk keperluan tampilan di FE Store (mis. badge "Tersedia: S, M, L").

## 6. Marketplace & Analytics

```typescript
// src/database/schema/marketplace-links.ts
import { pgTable, uuid, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { products } from './products';

export const marketplaceLinks = pgTable('marketplace_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  marketplaceName: varchar('marketplace_name', { length: 100 }).notNull(), // "Tokopedia" | "Shopee" | "Lazada" | "TikTok Shop" | "WhatsApp" | dst — free text, tidak di-enum supaya fleksibel nambah marketplace baru tanpa migration
  url: varchar('url', { length: 500 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIdx: index('marketplace_links_product_id_idx').on(table.productId),
}));
```

```typescript
// src/database/schema/product-clicks.ts
import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { products } from './products';
import { marketplaceLinks } from './marketplace-links';

export const productClicks = pgTable('product_clicks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }), // denormalized, hindari join saat agregasi analytics
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  marketplaceLinkId: uuid('marketplace_link_id').notNull().references(() => marketplaceLinks.id, { onDelete: 'cascade' }),
  ipHash: varchar('ip_hash', { length: 64 }), // hash, bukan raw IP (privacy)
  userAgent: varchar('user_agent', { length: 255 }),
  clickedAt: timestamp('clicked_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantClickedAtIdx: index('product_clicks_tenant_id_clicked_at_idx').on(table.tenantId, table.clickedAt),
  productIdx: index('product_clicks_product_id_idx').on(table.productId),
  marketplaceLinkIdx: index('product_clicks_marketplace_link_id_idx').on(table.marketplaceLinkId),
}));
```

## 7. Activity Log

```typescript
// src/database/schema/activity-logs.ts
import { pgTable, uuid, varchar, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users } from './users';

export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }), // null untuk aksi platform-level superadmin (mis. create tenant)
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(), // mis. "auth.login", "product.create", "store_settings.update"
  entity: varchar('entity', { length: 100 }),
  entityId: uuid('entity_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantCreatedAtIdx: index('activity_logs_tenant_id_created_at_idx').on(table.tenantId, table.createdAt),
  userIdx: index('activity_logs_user_id_idx').on(table.userId),
}));
```

## 8. Relations

```typescript
// src/database/schema/relations.ts
import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { domains } from './domains';
import { users } from './users';
import { refreshTokens } from './refresh-tokens';
import { categories } from './categories';
import { products } from './products';
import { productImages } from './product-images';
import { productVariantTypes } from './product-variant-types';
import { productVariantOptions } from './product-variant-options';
import { marketplaceLinks } from './marketplace-links';
import { productClicks } from './product-clicks';
import { activityLogs } from './activity-logs';

export const tenantsRelations = relations(tenants, ({ many }) => ({
  domains: many(domains),
  users: many(users),
  categories: many(categories),
  products: many(products),
}));

export const domainsRelations = relations(domains, ({ one }) => ({
  tenant: one(tenants, { fields: [domains.tenantId], references: [tenants.id] }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  refreshTokens: many(refreshTokens),
  activityLogs: many(activityLogs),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  tenant: one(tenants, { fields: [categories.tenantId], references: [tenants.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, { fields: [products.tenantId], references: [tenants.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variantTypes: many(productVariantTypes),
  marketplaceLinks: many(marketplaceLinks),
  clicks: many(productClicks),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const productVariantTypesRelations = relations(productVariantTypes, ({ one, many }) => ({
  product: one(products, { fields: [productVariantTypes.productId], references: [products.id] }),
  options: many(productVariantOptions),
}));

export const productVariantOptionsRelations = relations(productVariantOptions, ({ one }) => ({
  variantType: one(productVariantTypes, { fields: [productVariantOptions.variantTypeId], references: [productVariantTypes.id] }),
}));

export const marketplaceLinksRelations = relations(marketplaceLinks, ({ one, many }) => ({
  product: one(products, { fields: [marketplaceLinks.productId], references: [products.id] }),
  clicks: many(productClicks),
}));

export const productClicksRelations = relations(productClicks, ({ one }) => ({
  tenant: one(tenants, { fields: [productClicks.tenantId], references: [tenants.id] }),
  product: one(products, { fields: [productClicks.productId], references: [products.id] }),
  marketplaceLink: one(marketplaceLinks, { fields: [productClicks.marketplaceLinkId], references: [marketplaceLinks.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [activityLogs.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));
```

```typescript
// src/database/schema/index.ts
export * from './enums';
export * from './tenants';
export * from './domains';
export * from './users';
export * from './refresh-tokens';
export * from './categories';
export * from './products';
export * from './product-images';
export * from './product-variant-types';
export * from './product-variant-options';
export * from './marketplace-links';
export * from './product-clicks';
export * from './activity-logs';
export * from './relations';
```

## 9. Index Summary

| Table | Index | Tujuan |
|---|---|---|
| `domains` | unique(`hostname`) | Lookup tenant per request (hot path — dipanggil di setiap request Public Store API) |
| `domains` | (`tenant_id`) | List domain milik satu tenant di CMS |
| `users` | unique(`email`) | Login lookup |
| `users` | (`tenant_id`) | List admin per tenant (superadmin view) |
| `categories` | unique(`tenant_id`, `slug`) | Slug unik per tenant, bukan global |
| `products` | unique(`tenant_id`, `slug`) | Slug unik per tenant, dipakai di URL detail produk |
| `products` | (`tenant_id`, `status`) | List produk published di Store, filter status di CMS |
| `products` | (`tenant_id`, `category_id`) | Filter kategori di Store & CMS |
| `product_clicks` | (`tenant_id`, `clicked_at`) | Query analytics range tanggal per tenant |
| `activity_logs` | (`tenant_id`, `created_at`) | Query log per tenant, urut terbaru |

## 10. Migration Workflow (drizzle-kit)

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
```

- `drizzle-kit generate` — generate file migration SQL dari perubahan schema (review manual sebelum apply, terutama untuk perubahan yang destructive seperti drop column).
- `drizzle-kit migrate` — apply migration ke database (dijalankan saat startup container / CI-CD step, bukan otomatis tiap `nest start`).
- Migration file **tidak boleh diedit manual** setelah pernah di-apply ke environment manapun (termasuk lokal tim lain) — kalau perlu ubah, buat migration baru.
- Seed data awal (mis. akun superadmin pertama) dibuat lewat script terpisah (`src/database/seed.ts`), bukan lewat migration, supaya bisa idempotent dan tidak tercampur dengan schema history.

## 11. Kenapa Tidak Ada Tabel `roles` / `permissions`?

RBAC di sistem ini **declarative**, bukan database-driven — sengaja tidak ada tabel `roles`, `permissions`, atau `role_permissions`. Sebagai gantinya: `users.role` adalah enum tetap (`superadmin` | `admin`), dan permission matrix (section 5 di `backend-mvp-plan.md`) di-enforce lewat `@Roles()` decorator + `RoleGuard` di kode (NestJS), dicek dari klaim `role` di JWT — tanpa query/join tambahan tiap request.

Ini cukup karena:
- Hanya ada 2 role, sudah difinalkan (tidak ada role tambahan seperti "staff").
- Permission matrix fixed untuk semua tenant — tidak ada kebutuhan tenant bisa custom role/permission sendiri dari CMS.

**Kapan perlu upgrade ke tabel `roles`/`permissions`?** Kalau nanti requirement berubah jadi butuh role custom per tenant (mis. admin bisa bikin role "Staff Produk" dengan permission pilihan sendiri lewat CMS), baru perlu tambah tabel `roles` (scoped per tenant), `permissions` (daftar aksi statis), `role_permissions` (junction), dan ganti `users.role` enum jadi `users.role_id` FK. Ini perubahan skema yang cukup besar (migration + rewrite guard logic) — dicatat di sini supaya tidak jadi kejutan kalau requirement itu muncul nanti.

## 12. Catatan & Batasan MVP

- Belum ada full-text search index (`tsvector`) untuk `Search Product` — MVP cukup `ILIKE` pada `name`. Kalau volume produk besar/butuh relevansi ranking, evaluasi `pg_trgm` index atau external search (Meilisearch/Typesense) di fase berikutnya.
- `marketplace_name` sengaja `varchar` bebas (bukan enum Postgres) supaya admin bisa tambah marketplace baru tanpa perlu migration — validasi daftar yang diperbolehkan cukup di level DTO/aplikasi kalau dibutuhkan.
- `product_clicks.tenant_id` didenormalisasi dari `products.tenant_id` supaya query analytics (`Sprint 8`) tidak perlu join ke `products` tiap kali — trade-off standar untuk tabel analytics/append-only.
- Semua foreign key ke `tenants`/`products`/dst pakai `onDelete: 'cascade'` kecuali `products.category_id` (`set null`) — hapus kategori tidak menghapus produknya, hanya melepas relasinya.
