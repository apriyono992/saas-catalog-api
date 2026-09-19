import { relations } from 'drizzle-orm';
import { tenants } from './tenants';
import { storeSettings } from './store-settings';
import { domains } from './domains';
import { users } from './users';
import { refreshTokens } from './refresh-tokens';
import { categories } from './categories';
import { products } from './products';
import { productCategories } from './product-categories';
import { productImages } from './product-images';
import { productVariantTypes } from './product-variant-types';
import { productVariantOptions } from './product-variant-options';
import { marketplaces } from './marketplaces';
import { marketplaceLinks } from './marketplace-links';
import { productClicks } from './product-clicks';
import { activityLogs } from './activity-logs';

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  domains: many(domains),
  users: many(users),
  categories: many(categories),
  products: many(products),
  storeSettings: one(storeSettings, {
    fields: [tenants.id],
    references: [storeSettings.tenantId],
  }),
}));

export const storeSettingsRelations = relations(storeSettings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [storeSettings.tenantId],
    references: [tenants.id],
  }),
}));

export const domainsRelations = relations(domains, ({ one }) => ({
  tenant: one(tenants, {
    fields: [domains.tenantId],
    references: [tenants.id],
  }),
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
  tenant: one(tenants, {
    fields: [categories.tenantId],
    references: [tenants.id],
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'categoryHierarchy',
  }),
  children: many(categories, {
    relationName: 'categoryHierarchy',
  }),
  products: many(products),
  productCategories: many(productCategories),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  productCategories: many(productCategories),
  images: many(productImages),
  variantTypes: many(productVariantTypes),
  marketplaceLinks: many(marketplaceLinks),
  clicks: many(productClicks),
}));

export const productCategoriesRelations = relations(
  productCategories,
  ({ one }) => ({
    product: one(products, {
      fields: [productCategories.productId],
      references: [products.id],
    }),
    category: one(categories, {
      fields: [productCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantTypesRelations = relations(
  productVariantTypes,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariantTypes.productId],
      references: [products.id],
    }),
    options: many(productVariantOptions),
  }),
);

export const productVariantOptionsRelations = relations(
  productVariantOptions,
  ({ one }) => ({
    variantType: one(productVariantTypes, {
      fields: [productVariantOptions.variantTypeId],
      references: [productVariantTypes.id],
    }),
  }),
);

export const marketplacesRelations = relations(marketplaces, ({ many }) => ({
  marketplaceLinks: many(marketplaceLinks),
}));

export const marketplaceLinksRelations = relations(
  marketplaceLinks,
  ({ one, many }) => ({
    product: one(products, {
      fields: [marketplaceLinks.productId],
      references: [products.id],
    }),
    marketplace: one(marketplaces, {
      fields: [marketplaceLinks.marketplaceId],
      references: [marketplaces.id],
    }),
    clicks: many(productClicks),
  }),
);

export const productClicksRelations = relations(productClicks, ({ one }) => ({
  tenant: one(tenants, {
    fields: [productClicks.tenantId],
    references: [tenants.id],
  }),
  product: one(products, {
    fields: [productClicks.productId],
    references: [products.id],
  }),
  marketplaceLink: one(marketplaceLinks, {
    fields: [productClicks.marketplaceLinkId],
    references: [marketplaceLinks.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [activityLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));
