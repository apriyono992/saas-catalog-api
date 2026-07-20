import { pgEnum } from 'drizzle-orm/pg-core';

export const tenantStatusEnum = pgEnum('tenant_status', [
  'active',
  'suspended',
]);
export const userRoleEnum = pgEnum('user_role', ['superadmin', 'admin']);
export const productStatusEnum = pgEnum('product_status', [
  'draft',
  'published',
  'archived',
]);
