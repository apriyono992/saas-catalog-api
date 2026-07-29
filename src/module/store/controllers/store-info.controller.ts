import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantResolvedGuard } from '../../../shared/tenant/tenant-resolved.guard';
import { TenantContextService } from '../../../shared/tenant/tenant-context.service';
import { TenantsService } from '../../../shared/tenants/tenants.service';
import { StoreSettingsService } from '../../../shared/store-settings/store-settings.service';

@ApiTags('store')
@UseGuards(TenantResolvedGuard)
@Controller('store')
export class StoreInfoController {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantsService: TenantsService,
    private readonly storeSettingsService: StoreSettingsService,
  ) {}

  @Get()
  async getStoreInfo() {
    const tenantId = this.tenantContextService.getTenantIdOrThrow();
    const [tenant, settings] = await Promise.all([
      this.tenantsService.findByIdOrThrow(tenantId),
      this.storeSettingsService.findByTenantId(tenantId),
    ]);

    return {
      name: tenant.name,
      ...settings,
    };
  }

  @Get('resolve')
  resolve() {
    return this.tenantContextService.getOrThrow();
  }
}
