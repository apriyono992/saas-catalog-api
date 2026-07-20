# SaaS Catalog — Backend Folder Structure

Status: Draft
Owner: Backend Team
Terakhir diupdate: 2026-07-20
Referensi: [`backend-mvp-plan.md`](./backend-mvp-plan.md), [`database-schema.md`](./database-schema.md)

## 1. Prinsip

- **Presentation layer dipisah per consumer**: `module/store` (publik, no-auth) dan `module/admin` (CMS, JWT-auth) adalah folder terpisah, tidak ada controller yang dipakai bersama. Ini bikin permission model gampang diaudit — cukup lihat folder mana yang punya `@UseGuards`, tidak perlu cek tiap route satu-satu.
- **Business logic dipakai bersama** lewat layer `shared/` — service & repository (mis. `ProductsService`, `ProductsRepository`) sama untuk store maupun admin, supaya query/logic tidak dobel-tulis. Yang beda hanya: controller (routing + guard) dan DTO (response publik vs response lengkap untuk CMS).
- **Superadmin dipisah lagi di dalam admin**: `module/admin/platform/` khusus endpoint cross-tenant (`tenants`, `users` lintas tenant) yang **hanya** boleh diakses `superadmin`. Endpoint tenant-scoped biasa (produk, kategori, dst) tetap di `module/admin/` level atas.
- **Route prefix mengikuti folder**, supaya guard bisa di-apply per prefix, bukan per-controller manual:
  - `/store/**` → publik, `TenantMiddleware` resolve tenant dari `Host` header, **tanpa** JWT guard.
  - `/cms/**` → admin & superadmin, wajib `JwtAuthGuard`, tenant dari klaim JWT.
  - `/cms/platform/**` → subset `/cms`, tambahan `@Roles('superadmin')`.

> Catatan: ini mengubah beberapa path di section 7 `backend-mvp-plan.md` (yang tadinya flat, mis. `/products` dipakai publik & CMS sekaligus) menjadi prefixed (`/store/products` vs `/cms/products`) — lihat section 5 dokumen ini untuk mapping lengkap.

## 2. Struktur Folder

```
src/
├── main.ts
├── app.module.ts
│
├── config/
│   ├── config.module.ts
│   ├── configuration.ts
│   └── env.validation.ts
│
├── database/
│   ├── database.module.ts
│   ├── database.providers.ts        # Drizzle client provider (DATABASE_CONNECTION)
│   ├── schema/                      # lihat database-schema.md
│   │   ├── enums.ts
│   │   ├── tenants.ts
│   │   ├── domains.ts
│   │   ├── users.ts
│   │   ├── refresh-tokens.ts
│   │   ├── categories.ts
│   │   ├── products.ts
│   │   ├── product-images.ts
│   │   ├── product-variant-types.ts
│   │   ├── product-variant-options.ts
│   │   ├── marketplace-links.ts
│   │   ├── product-clicks.ts
│   │   ├── activity-logs.ts
│   │   ├── relations.ts
│   │   └── index.ts
│   ├── migrations/                  # generated drizzle-kit, jangan diedit manual
│   └── seed.ts                      # seed superadmin pertama, dll
│
├── common/                          # cross-cutting, tidak spesifik ke satu module manapun
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── current-tenant.decorator.ts
│   │   └── roles.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   ├── activity-log.interceptor.ts
│   │   └── transform-response.interceptor.ts
│   └── dto/
│       └── pagination-query.dto.ts
│
├── shared/                          # domain/business-logic, dipakai lintas store & admin
│   ├── tenant/
│   │   ├── tenant.module.ts
│   │   ├── tenant.middleware.ts     # resolve X-Tenant-Host / X-Forwarded-Host / Host -> tenant
│   │   ├── tenant-context.service.ts# AsyncLocalStorage wrapper, dipakai base repository
│   │   └── tenant-resolved.guard.ts # block request tanpa tenant match (404), khusus /store
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts          # login, refresh, logout, password hash (Argon2)
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── refresh-token.repository.ts
│   ├── catalog/
│   │   ├── categories/
│   │   │   ├── categories.module.ts
│   │   │   ├── categories.service.ts
│   │   │   └── categories.repository.ts
│   │   ├── products/
│   │   │   ├── products.module.ts
│   │   │   ├── products.service.ts
│   │   │   └── products.repository.ts
│   │   ├── product-images/
│   │   │   ├── product-images.module.ts
│   │   │   └── product-images.service.ts
│   │   ├── product-variants/
│   │   │   ├── product-variants.module.ts
│   │   │   └── product-variants.service.ts
│   │   └── marketplace-links/
│   │       ├── marketplace-links.module.ts
│   │       └── marketplace-links.service.ts
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   ├── click-tracking.service.ts    # dipakai store (record klik, redirect)
│   │   └── analytics-query.service.ts   # dipakai admin (laporan agregat)
│   ├── activity-log/
│   │   ├── activity-log.module.ts
│   │   └── activity-log.service.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   └── users.service.ts             # profile + user management
│   ├── tenants/
│   │   ├── tenants.module.ts
│   │   └── tenants.service.ts           # tenant lifecycle (dipakai platform/superadmin)
│   ├── domains/
│   │   ├── domains.module.ts
│   │   └── domains.service.ts           # domain CRUD + verifikasi
│   ├── store-settings/
│   │   ├── store-settings.module.ts
│   │   └── store-settings.service.ts
│   └── storage/
│       ├── storage.module.ts
│       ├── storage-provider.interface.ts
│       ├── local-storage.provider.ts
│       └── s3-storage.provider.ts       # implement di Sprint 9, interface sudah siap dari awal
│
├── module/
│   ├── store/                       # ============ PUBLIC (prefix /store, no-auth) ============
│   │   ├── store.module.ts
│   │   ├── controllers/
│   │   │   ├── store-info.controller.ts     # GET /store, GET /store/resolve
│   │   │   ├── products.controller.ts       # GET /store/products, /:slug, /:slug/related
│   │   │   └── marketplace.controller.ts    # POST /store/marketplace/:linkId/redirect
│   │   └── dto/
│   │       ├── product-list-item.response.dto.ts   # response ramping, tanpa field internal
│   │       └── product-detail.response.dto.ts
│   │
│   └── admin/                       # ============ CMS (prefix /cms, JwtAuthGuard) ============
│       ├── admin.module.ts
│       ├── auth/
│       │   └── auth.controller.ts               # POST /cms/auth/login, refresh, logout
│       ├── profile/
│       │   └── profile.controller.ts            # GET/PATCH /cms/profile, change-password
│       ├── products/
│       │   └── products.controller.ts           # CRUD, publish/archive, images, variants, marketplace-links
│       ├── categories/
│       │   └── categories.controller.ts
│       ├── store-settings/
│       │   └── store-settings.controller.ts
│       ├── domains/
│       │   └── domains.controller.ts            # kelola domain tenant sendiri
│       ├── analytics/
│       │   └── analytics.controller.ts          # scoped ke tenant sendiri
│       ├── activity-logs/
│       │   └── activity-logs.controller.ts      # scoped ke tenant sendiri
│       │
│       └── platform/                # ---- SUPERADMIN ONLY (prefix /cms/platform) ----
│           ├── tenants/
│           │   └── tenants.controller.ts        # CRUD tenant, suspend
│           └── users/
│               └── users.controller.ts          # kelola admin lintas tenant
│
└── health/
    └── health.controller.ts         # GET /health
```

## 3. Alur Dependency

```
Controller (module/store/** | module/admin/**)
    -> Service (shared/**)
        -> Repository (shared/**, pakai Drizzle client dari database/)
            -> Drizzle schema (database/schema/**)
```

- `module/store` dan `module/admin` **hanya boleh** import dari `shared/` dan `common/` — tidak pernah import satu sama lain.
- `shared/**` tidak boleh import dari `module/**` (arah dependency satu arah, cegah circular import).
- DTO request/response tetap didefinisikan di masing-masing `module/store/dto` atau di dalam folder controller admin (bukan di `shared/`), karena bentuk response publik vs CMS sengaja berbeda (mis. Store tidak butuh `createdAt`/`updatedAt`, admin butuh semua field + audit info).

## 4. Guard & Middleware Map

| Prefix | Middleware | Guard | Tenant source |
|---|---|---|---|
| `/store/**` | `TenantMiddleware` (wajib) | `TenantResolvedGuard` (404 kalau domain tidak match) | `Host` header → tabel `domains` |
| `/cms/**` (kecuali `/cms/auth/*`) | – | `JwtAuthGuard` | Klaim `tenantId` di JWT |
| `/cms/platform/**` | – | `JwtAuthGuard` + `RolesGuard(@Roles('superadmin'))` | Tidak scoped tenant (cross-tenant) |
| `/cms/auth/login` | – | – (public, tapi bukan bagian dari `/store`) | – |
| `/health` | – | – | – |

`AppModule` daftarkan `TenantMiddleware` hanya untuk `.forRoutes('store/*')` (`consumer.apply(TenantMiddleware).forRoutes('store/*')`), supaya request ke `/cms/**` tidak ikut kena lookup domain yang tidak relevan.

## 5. Mapping Path Lama → Path Baru (update dari `backend-mvp-plan.md` section 7)

| Lama (flat, section 7 versi awal) | Baru (prefixed) |
|---|---|
| `GET /store` | `GET /store` *(tetap, sudah prefix)* |
| `GET /store/resolve` | `GET /store/resolve` *(tetap)* |
| `GET /products` | `GET /store/products` |
| `GET /products/:slug` | `GET /store/products/:slug` |
| `GET /products/:slug/related` | `GET /store/products/:slug/related` |
| `POST /marketplace/:linkId/redirect` | `POST /store/marketplace/:linkId/redirect` |
| `POST /auth/login` dst | `POST /cms/auth/login` dst |
| `GET/PATCH /profile` | `GET/PATCH /cms/profile` |
| `GET/POST/PATCH/DELETE /products` dst | `GET/POST/PATCH/DELETE /cms/products` dst |
| `GET/POST/PATCH/DELETE /categories` | `GET/POST/PATCH/DELETE /cms/categories` |
| `GET/PATCH /store-settings` dst | `GET/PATCH /cms/store-settings` dst |
| `GET/POST /domains`, `DELETE /domains/:id` | `GET/POST /cms/domains`, `DELETE /cms/domains/:id` |
| `GET /analytics/clicks` dst | `GET /cms/analytics/clicks` dst |
| `GET /activity-logs` | `GET /cms/activity-logs` |
| `GET/POST/PATCH /tenants`, `POST /tenants/:id/suspend` | `GET/POST/PATCH /cms/platform/tenants`, `POST /cms/platform/tenants/:id/suspend` |
| `GET/POST/PATCH /users`, `POST /users/:id/disable` | `GET/POST/PATCH /cms/platform/users`, `POST /cms/platform/users/:id/disable` |

## 6. Module Wiring (`app.module.ts`)

```typescript
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    // shared/domain modules
    TenantModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    DomainsModule,
    StoreSettingsModule,
    CategoriesModule,
    ProductsModule,
    ProductImagesModule,
    ProductVariantsModule,
    MarketplaceLinksModule,
    AnalyticsModule,
    ActivityLogModule,
    StorageModule,
    // presentation modules
    StoreModule,   // module/store
    AdminModule,   // module/admin (import AdminPlatformModule di dalamnya)
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('store/*');
  }
}
```

`AdminModule` sendiri meng-import sub-module `platform/` (`AdminTenantsController`, `AdminUsersController`) supaya nesting folder tercermin di nesting module, bukan didaftarkan flat di `AppModule`.

## 7. Kenapa Bukan Full Duplikasi (store punya service sendiri, admin punya service sendiri)?

Dipertimbangkan, tapi ditolak untuk MVP:
- **Plus duplikasi**: isolasi total, perubahan di admin tidak mungkin tidak sengaja mempengaruhi store.
- **Minus duplikasi**: query/business logic (pagination, filter kategori, slug generation, dll) harus ditulis dua kali dan gampang divergen (bug fix di satu sisi lupa di-apply ke sisi lain).

Karena isolasi keamanan sudah didapat dari pemisahan **controller + guard + route prefix** (bukan dari pemisahan service), risiko "admin logic bocor ke publik" tetap kecil selama disiplin: controller `module/store/**` **tidak pernah** memanggil method service yang mengembalikan field sensitif (mis. `ProductsService.findAllForAdmin()` vs `ProductsService.findPublished()` — dua method eksplisit berbeda, bukan satu method dengan flag `isAdmin: boolean`).

## 8. Catatan

- Kalau nanti tim bertambah besar dan butuh isolasi lebih ketat (mis. tim store dan tim CMS benar-benar terpisah, deploy terpisah), struktur ini sudah siap displit jadi 2 NestJS app terpisah (Nx monorepo `apps/store-api` + `apps/cms-api` + `libs/shared`) tanpa perlu redesign besar — tinggal pindahkan `shared/` jadi library.
- Penamaan folder top-level pakai `module/` (singular) sesuai permintaan; kalau tim lebih familiar konvensi Nest community (`modules/`, plural), tinggal rename — tidak mempengaruhi arsitektur.
