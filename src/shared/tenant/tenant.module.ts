import { Global, Module } from '@nestjs/common';
import { DomainsModule } from '../domains/domains.module';
import { TenantsModule } from '../tenants/tenants.module';
import { TenantContextService } from './tenant-context.service';
import { TenantMiddleware } from './tenant.middleware';
import { TenantResolvedGuard } from './tenant-resolved.guard';

@Global()
@Module({
  imports: [DomainsModule, TenantsModule],
  providers: [TenantContextService, TenantMiddleware, TenantResolvedGuard],
  exports: [TenantContextService, TenantMiddleware, TenantResolvedGuard],
})
export class TenantModule {}
