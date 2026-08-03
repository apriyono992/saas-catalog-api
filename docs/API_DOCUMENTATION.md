# SaaS Catalog API — Documentation

Multi-tenant SaaS catalog backend. NestJS + Fastify + Drizzle ORM + PostgreSQL.

Interactive Swagger UI is also available at `GET /docs` on any running instance.

A ready-to-import Postman collection + environment live in [`docs/postman/`](./postman).

---

## Table of contents

1. [Base URL & environment](#base-url--environment)
2. [Multi-tenancy model](#multi-tenancy-model)
3. [Authentication](#authentication)
4. [Conventions](#conventions) (errors, pagination, rate limiting, validation)
5. [Auth endpoints](#1-auth-endpoints) — `/cms/auth/*`
6. [Store endpoints (public)](#2-store-endpoints-public) — `/store/*`
7. [CMS endpoints (tenant admin)](#3-cms-endpoints-tenant-admin) — `/cms/*`
8. [Platform endpoints (superadmin)](#4-platform-endpoints-superadmin) — `/cms/platform/*`
9. [Health](#5-health)
10. [Data model reference](#data-model-reference)

---

## Base URL & environment

No global path prefix is configured — routes are exactly as documented below (e.g. `POST /cms/auth/login`, not `/api/cms/auth/login`).

| Env var | Purpose |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `CMS_APP_DOMAIN` | Hostname of the CMS frontend, always allowed by CORS |
| `DATABASE_URL` | Postgres connection string |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_TTL` | Access token signing secret / TTL (default `15m`) |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_TTL` | Refresh token secret / TTL (default `7d`) — refresh tokens are opaque random strings, not JWTs; this secret is currently unused by the rotation logic itself but reserved |
| `STORAGE_DRIVER` | `local` or `s3` |
| `UPLOAD_DIR` | Local upload directory (when driver=`local`), served at `/uploads/*` |
| `S3_*` | S3 / S3-compatible (MinIO, R2, Spaces) config, used when driver=`s3` |

Locally: `http://localhost:3000`.

---

## Multi-tenancy model

The API has **two independent ways of determining "which tenant"**, depending on whether the route is public storefront or authenticated CMS.

### 1. Storefront routes (`/store/**`) — resolved by hostname

`TenantMiddleware` runs on every `/store` and `/store/**` request. It reads a hostname from, in order:

1. `X-Tenant-Host` header
2. `X-Forwarded-Host` header
3. `Host` header

...looks it up in the `domains` table, and resolves the owning tenant. If no domain matches, every `/store/**` route returns `404 Tenant not found` (thrown by `TenantResolvedGuard`).

**In Postman/curl, since your `Host` header is normally `localhost:3000`, set `X-Tenant-Host` explicitly** to the tenant's registered domain (e.g. `tokosaya.com`) to simulate a real storefront request:

```
GET /store/products
X-Tenant-Host: tokosaya.com
```

A suspended tenant (`status = 'suspended'`) still resolves but the resolved context carries `tenantStatus: 'suspended'` — the storefront controllers do not currently reject on this status themselves (no explicit check found beyond resolution).

### 2. CMS routes (`/cms/**`) — resolved by JWT

CMS routes carry no Host-based tenant resolution. The tenant is embedded in the access token issued at login (`tenantId` claim), injected via `@CurrentTenant()`. This means:

- A **tenant admin** (`role: 'admin'`) always has a `tenantId` and can only ever see/modify their own tenant's data.
- A **superadmin** (`role: 'superadmin'`) has `tenantId: null`. Any tenant-scoped CMS endpoint (categories, products, domains, store-settings, analytics, activity-logs, profile's tenant-bound aspects) rejects superadmin callers with **`403 Forbidden — This action requires a tenant-scoped account`**. Superadmins manage tenants and admin users exclusively through the `/cms/platform/**` routes (see [§4](#4-platform-endpoints-superadmin)).

---

## Authentication

JWT bearer access token + rotating opaque refresh token.

1. `POST /cms/auth/login` with email/password → `{ accessToken, refreshToken }`.
2. Send `Authorization: Bearer <accessToken>` on every `/cms/**` request (except `/cms/auth/*`).
3. Access tokens expire quickly (default 15 min). When expired, call `POST /cms/auth/refresh` with the current `refreshToken` to get a **new** token pair — the old refresh token is revoked immediately on use (rotation), so always store the newest one.
4. `POST /cms/auth/logout` revokes a refresh token (used on sign-out).

Access token JWT payload: `{ sub: userId, tenantId: string | null, role: 'admin' | 'superadmin' }`.

Refresh tokens are stored server-side only as a SHA-256 hash — the raw value is never persisted, so a leaked database dump cannot be replayed as a session.

---

## Conventions

### Error format

Every error (validation, auth, not-found, conflict, unhandled) is normalized by a global exception filter to:

```json
{
  "statusCode": 400,
  "message": "name should not be empty",
  "path": "/cms/categories",
  "timestamp": "2026-07-30T10:00:00.000Z"
}
```

`message` may be a string or an array of strings (class-validator produces one message per failed field/rule).

Common status codes used throughout: `400` validation, `401` missing/invalid/expired token or bad credentials, `403` role/tenant-scope violation, `404` not found, `409` conflict (duplicate slug/email/hostname), `429` rate limited.

### Validation

All request bodies/queries are validated with `whitelist: true, forbidNonWhitelisted: true` — **unknown fields in the body cause a 400**, and values are auto-coerced to the DTO's declared types (e.g. `?page=2` string → `number`).

### Pagination

Endpoints using `PaginationQueryDto` accept:

| Query param | Type | Default | Constraints |
|---|---|---|---|
| `page` | integer | `1` | min `1` |
| `limit` | integer | `20` | min `1`, max `100` |

Response shape differs slightly per endpoint — see each table below (some return `{ items, total }`, storefront product listing returns `{ data, meta: { page, limit, total, totalPages } }`).

### Rate limiting

Global: 100 requests / 60s per client (`ThrottlerGuard`, applied to every route). `POST /cms/auth/login` has a stricter override: **5 requests / 60s**.

### File upload

`POST /cms/products/:id/images` accepts `multipart/form-data`, single file field, max **5 MB**, only `image/jpeg`, `image/png`, `image/webp`.

### Activity logging

Mutating CMS endpoints marked "✅" in the **Logged** column below record an audit entry (visible via `GET /cms/activity-logs`) with the acting user, action name, entity, entity id, and (for POST/PATCH/PUT) a redacted copy of the request body (`password`/`currentPassword`/`newPassword` fields stripped).

---

## 1. Auth endpoints

Base path: `/cms/auth`. No authentication required (these routes issue credentials).

| Method & Path | Body | Response | Notes |
|---|---|---|---|
| `POST /cms/auth/login` | `LoginDto` | `200 { accessToken, refreshToken }` | Rate-limited to 5/min. `401` on bad credentials or disabled user. |
| `POST /cms/auth/refresh` | `RefreshTokenDto` | `200 { accessToken, refreshToken }` | Rotates the refresh token; old one is revoked. `401` if invalid/expired/revoked. |
| `POST /cms/auth/logout` | `RefreshTokenDto` | `204` | Revokes the token; safe to call even if already invalid. |

**`LoginDto`**
```ts
{ email: string /* valid email */, password: string /* min 8 chars */ }
```

**`RefreshTokenDto`**
```ts
{ refreshToken: string /* not empty */ }
```

---

## 2. Store endpoints (public)

Base path: `/store`. Guard: `TenantResolvedGuard` (tenant resolved via Host header — see [Multi-tenancy model](#multi-tenancy-model)). No JWT.

| Method & Path | Query / Params | Response | Description |
|---|---|---|---|
| `GET /store` | — | `{ name, description, contactEmail, contactPhone, socialInstagram, socialFacebook, socialTiktok, socialWhatsapp }` | Store profile for the resolved tenant |
| `GET /store/resolve` | — | `{ tenantId, tenantStatus }` | Debug endpoint exposing the raw resolved tenant context |
| `GET /store/products` | `page?, limit?, category?, search?` | `{ data: ProductListItem[], meta: { page, limit, total, totalPages } }` | Paginated **published** products |
| `GET /store/products/:slug` | — | `ProductDetail` | Full detail of one published product |
| `GET /store/products/:slug/related` | — | `ProductListItem[]` (up to 4) | Other published products in the same category |
| `POST /store/marketplace/:linkId/redirect` | — | `200 { url }` | Records a click event, returns the marketplace URL to redirect to |

**`ProductListItem`**
```ts
{ id, name, slug, basePrice: string, thumbnailUrl: string | null, category: { id, name, slug } | null }
```

**`ProductDetail`**
```ts
{
  id, name, slug, description: string | null, basePrice: string,
  images: string[],                              // image URLs, in sortOrder
  category: { id, name, slug } | null,
  variantTypes: { name: string, options: string[] }[],
  marketplaceLinks: { id, marketplaceName: string }[],
}
```

---

## 3. CMS endpoints (tenant admin)

Base path: `/cms`. Guard: `JwtAuthGuard` (any authenticated user). All tenant-scoped resources additionally require the caller to have a `tenantId` (i.e. **superadmin gets 403** — see [Multi-tenancy model](#multi-tenancy-model)). Send `Authorization: Bearer <accessToken>`.

### 3.1 Profile — `/cms/profile`

Works for any authenticated user, including superadmin (identity-only, not tenant-scoped).

| Method & Path | Body | Response | Logged | Description |
|---|---|---|---|---|
| `GET /cms/profile` | — | `{ id, tenantId, email, role, isActive, createdAt, updatedAt }` | — | Own profile |
| `PATCH /cms/profile` | `UpdateProfileDto` | same shape | — | Change own email (`409` if in use) |
| `POST /cms/profile/change-password` | `ChangePasswordDto` | `204` | — | Change own password (`401` if `currentPassword` wrong) |

```ts
UpdateProfileDto    { email: string /* valid email */ }
ChangePasswordDto   { currentPassword: string, newPassword: string /* min 8 */ }
```

### 3.2 Categories — `/cms/categories`

| Method & Path | Body | Response | Logged | Description |
|---|---|---|---|---|
| `GET /cms/categories` | — | `Category[]` | — | List, ordered by name |
| `GET /cms/categories/:id` | — | `Category` | — | `404` if not found |
| `POST /cms/categories` | `CreateCategoryDto` | `Category` | ✅ `category.create` | Slug auto-generated from name if omitted |
| `PATCH /cms/categories/:id` | `UpdateCategoryDto` | `Category` | ✅ `category.update` | `409` on slug conflict |
| `DELETE /cms/categories/:id` | — | `204` | ✅ `category.delete` | |

```ts
CreateCategoryDto { name: string /* 1-150 */, slug?: string /* 1-160, ^[a-z0-9]+(-[a-z0-9]+)*$ */ }
UpdateCategoryDto   // same fields, all optional (PartialType)
Category            { id, tenantId, name, slug, createdAt, updatedAt }
```

### 3.3 Products — `/cms/products`

| Method & Path | Body | Response | Logged | Description |
|---|---|---|---|---|
| `GET /cms/products` | `AdminListProductsQueryDto` (query) | `{ items: Product[], total }` | — | All statuses, filterable |
| `GET /cms/products/:id` | — | `Product` (+ images, category, variantTypes.options, marketplaceLinks) | — | `404` if not found |
| `POST /cms/products` | `CreateProductDto` | `Product` | ✅ `product.create` | Created as `draft`; slug auto-generated if omitted; `409` on slug conflict |
| `PATCH /cms/products/:id` | `UpdateProductDto` | `Product` | ✅ `product.update` | `409` on slug conflict |
| `DELETE /cms/products/:id` | — | `204` | ✅ `product.delete` | **Only while `status = draft`** — `409` otherwise (archive instead, to preserve click history) |
| `POST /cms/products/:id/publish` | — | `Product` (`status: published`) | ✅ `product.publish` | |
| `POST /cms/products/:id/archive` | — | `Product` (`status: archived`) | ✅ `product.archive` | |

```ts
AdminListProductsQueryDto { page?, limit?, status?: 'draft'|'published'|'archived', search?: string }
CreateProductDto {
  name: string /* max 255 */,
  slug?: string /* max 280, slug pattern */,
  description?: string,
  categoryId?: string /* uuid */,
  basePrice?: string /* decimal, ^\d+(\.\d{1,2})?$ */,
}
UpdateProductDto  // same fields, all optional
Product { id, tenantId, categoryId, name, slug, description, basePrice, status, createdAt, updatedAt }
```

#### 3.3.1 Product images — `/cms/products/:id/images`

| Method & Path | Body | Response | Logged | Description |
|---|---|---|---|---|
| `POST /cms/products/:id/images` | `multipart/form-data`, 1 file field, ≤5MB, jpeg/png/webp | `ProductImage` | — | `400` on bad file, `404` if product not found |
| `PATCH /cms/products/:id/images/reorder` | `ReorderImagesDto` | `204` | — | Reorders by an ordered list of image IDs |
| `DELETE /cms/products/:id/images/:imageId` | — | `204` | — | Also deletes the file from storage |

```ts
ReorderImagesDto { imageIds: string[] /* non-empty, each a uuid v4 */ }
ProductImage { id, productId, url, sortOrder, createdAt }
```

#### 3.3.2 Variant types — `/cms/products/:id/variant-types`

| Method & Path | Body | Response | Description |
|---|---|---|---|
| `GET /cms/products/:id/variant-types` | — | `VariantType[]` | e.g. "Ukuran"/Size |
| `POST /cms/products/:id/variant-types` | `CreateVariantTypeDto` | `VariantType` | |
| `PATCH /cms/products/:id/variant-types/:typeId` | `UpdateVariantTypeDto` | `VariantType` | |
| `DELETE /cms/products/:id/variant-types/:typeId` | — | `204` | |

```ts
CreateVariantTypeDto { name: string /* max 100 */ }
UpdateVariantTypeDto { name?: string, sortOrder?: number /* min 0 */ }
VariantType { id, productId, name, sortOrder }
```

#### 3.3.3 Variant options — `/cms/products/:id/variant-types/:typeId/options`

| Method & Path | Body | Response | Description |
|---|---|---|---|
| `GET .../options` | — | `VariantOption[]` | e.g. S/M/L |
| `POST .../options` | `CreateVariantOptionDto` | `VariantOption` | |
| `PATCH .../options/:optionId` | `UpdateVariantOptionDto` | `VariantOption` | |
| `DELETE .../options/:optionId` | — | `204` | |

```ts
CreateVariantOptionDto { value: string /* max 100 */ }
UpdateVariantOptionDto { value?: string, sortOrder?: number /* min 0 */ }
VariantOption { id, variantTypeId, value, sortOrder }
```

#### 3.3.4 Marketplace links — `/cms/products/:id/marketplace-links`

| Method & Path | Body | Response | Description |
|---|---|---|---|
| `GET .../marketplace-links` | — | `MarketplaceLink[]` | |
| `POST .../marketplace-links` | `CreateMarketplaceLinkDto` | `MarketplaceLink` | e.g. a Tokopedia listing |
| `PATCH .../marketplace-links/:linkId` | `UpdateMarketplaceLinkDto` | `MarketplaceLink` | |
| `DELETE .../marketplace-links/:linkId` | — | `204` | |

```ts
CreateMarketplaceLinkDto { marketplaceName: string /* max 100 */, url: string /* valid URL, max 500 */ }
UpdateMarketplaceLinkDto { marketplaceName?: string, url?: string }
MarketplaceLink { id, productId, marketplaceName, url, sortOrder, createdAt }
```

### 3.4 Domains — `/cms/domains`

| Method & Path | Body | Response | Description |
|---|---|---|---|
| `GET /cms/domains` | — | `Domain[]` | |
| `POST /cms/domains` | `CreateDomainDto` | `Domain` | `409` if hostname already registered |
| `POST /cms/domains/:id/verify` | — | `Domain` (`verifiedAt` set) | `404` if not found |
| `DELETE /cms/domains/:id` | — | `204` | |

```ts
CreateDomainDto { hostname: string /* max 255, domain-name pattern */ }
Domain { id, tenantId, hostname, isPrimary, verifiedAt, createdAt }
```

### 3.5 Store settings — `/cms/store-settings`

| Method & Path | Body | Response | Logged | Description |
|---|---|---|---|---|
| `GET /cms/store-settings` | — | `StoreSettings` | — | Auto-creates an empty row on first access |
| `PATCH /cms/store-settings` | `UpdateStoreSettingsDto` | `StoreSettings` | ✅ `store_settings.update` | Updates `description` |
| `PATCH /cms/store-settings/contact` | `UpdateStoreSettingsContactDto` | `StoreSettings` | ✅ `store_settings.update_contact` | |
| `PATCH /cms/store-settings/social` | `UpdateStoreSettingsSocialDto` | `StoreSettings` | ✅ `store_settings.update_social` | |

```ts
UpdateStoreSettingsDto        { description?: string }
UpdateStoreSettingsContactDto { contactEmail?: string /* email */, contactPhone?: string /* max 50 */ }
UpdateStoreSettingsSocialDto  { socialInstagram?: string, socialFacebook?: string, socialTiktok?: string /* each max 255 */, socialWhatsapp?: string /* max 50 */ }
StoreSettings { id, tenantId, description, contactEmail, contactPhone, socialInstagram, socialFacebook, socialTiktok, socialWhatsapp, createdAt, updatedAt }
```

### 3.6 Analytics — `/cms/analytics/clicks`

| Method & Path | Query | Response | Description |
|---|---|---|---|
| `GET /cms/analytics/clicks` | `from?, to?` (ISO 8601) | `{ total }` | Total marketplace-link clicks in range |
| `GET /cms/analytics/clicks/by-product` | `from?, to?` | `[{ productId, productName, productSlug, count }]` | Desc by count |
| `GET /cms/analytics/clicks/by-marketplace` | `from?, to?` | `[{ marketplaceName, count }]` | Desc by count |

### 3.7 Activity logs — `/cms/activity-logs`

| Method & Path | Query | Response | Description |
|---|---|---|---|
| `GET /cms/activity-logs` | `page?, limit?` | `{ items: ActivityLog[], total }` | Newest first; each item includes nested `user: { id, email }` |

```ts
ActivityLog { id, tenantId, userId, action, entity, entityId, metadata, createdAt, user: { id, email } }
```

---

## 4. Platform endpoints (superadmin)

Base path: `/cms/platform`. Guards: `JwtAuthGuard, RolesGuard` + `@Roles('superadmin')` — **`403` for `admin` role**. These act across all tenants.

### 4.1 Tenants — `/cms/platform/tenants`

| Method & Path | Body | Response | Description |
|---|---|---|---|
| `GET /cms/platform/tenants` | — | `Tenant[]` | |
| `GET /cms/platform/tenants/:id` | — | `Tenant` | `404` if not found |
| `POST /cms/platform/tenants` | `CreateTenantDto` | `Tenant` | Also creates an empty `store_settings` row for the tenant |
| `PATCH /cms/platform/tenants/:id` | `UpdateTenantDto` | `Tenant` | |
| `POST /cms/platform/tenants/:id/suspend` | — | `Tenant` (`status: suspended`) | |
| `POST /cms/platform/tenants/:id/activate` | — | `Tenant` (`status: active`) | |

```ts
CreateTenantDto { name: string /* 1-255 */ }
UpdateTenantDto { name?: string, status?: 'active' | 'suspended' }
Tenant { id, name, status, createdAt, updatedAt }
```

### 4.2 Admin users — `/cms/platform/users`

Manages `role: 'admin'` accounts only (superadmin accounts are hidden from these list/detail results).

| Method & Path | Body | Response | Logged | Description |
|---|---|---|---|---|
| `GET /cms/platform/users` | `tenantId?` (query) | `AdminProfile[]` | — | Optionally filter by tenant |
| `GET /cms/platform/users/:id` | — | `AdminProfile` | — | `404` if not found or not an `admin` |
| `POST /cms/platform/users` | `CreateAdminDto` | `AdminProfile` | ✅ `user.create` | `404` if tenant doesn't exist, `409` if email in use |
| `PATCH /cms/platform/users/:id` | `UpdateAdminDto` | `AdminProfile` | ✅ `user.update` | Changes email; `409` if in use |
| `POST /cms/platform/users/:id/disable` | — | `AdminProfile` (`isActive: false`) | ✅ `user.disable` | |

```ts
CreateAdminDto { tenantId: string /* uuid */, email: string /* email */, password: string /* min 8 */ }
UpdateAdminDto { email: string /* email */ }
AdminProfile { id, tenantId, email, role, isActive, createdAt, updatedAt }
```

---

## 5. Health

| Method & Path | Response | Description |
|---|---|---|
| `GET /health` | `200 { status: 'ok', timestamp }` / `503` if DB unreachable | Liveness/readiness probe (`select 1`) |

---

## Data model reference

Enum values (from `src/database/schema/enums.ts`):

| Enum | Values |
|---|---|
| Tenant status | `active`, `suspended` |
| User role | `superadmin`, `admin` |
| Product status | `draft`, `published`, `archived` |

### Endpoint count summary

| Group | Count |
|---|---|
| Auth | 3 |
| Store (public) | 6 |
| CMS (tenant admin) | 42 |
| Platform (superadmin) | 11 |
| Health | 1 |
| **Total** | **63** |
