import { ForbiddenException } from '@nestjs/common';

/** Superadmins have no tenantId — block them from tenant-self-service endpoints (they use /cms/platform/** instead). */
export function assertTenantScoped(
  tenantId: string | null,
): asserts tenantId is string {
  if (!tenantId) {
    throw new ForbiddenException(
      'This action requires a tenant-scoped account',
    );
  }
}
