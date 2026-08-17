import { Injectable } from '@nestjs/common';
import { assertTenantScoped } from '../../common/utils/assert-tenant-scoped.util';
import {
  DateRangeFilter,
  ProductClicksRepository,
} from './product-clicks.repository';

@Injectable()
export class AnalyticsQueryService {
  constructor(
    private readonly productClicksRepository: ProductClicksRepository,
  ) {}

  async getTotalClicks(tenantId: string | null, range: DateRangeFilter) {
    assertTenantScoped(tenantId);
    const total = await this.productClicksRepository.countTotal(
      tenantId,
      range,
    );
    return { total };
  }

  getClicksByProduct(tenantId: string | null, range: DateRangeFilter) {
    assertTenantScoped(tenantId);
    return this.productClicksRepository.countByProduct(tenantId, range);
  }

  getClicksByMarketplace(tenantId: string | null, range: DateRangeFilter) {
    assertTenantScoped(tenantId);
    return this.productClicksRepository.countByMarketplace(tenantId, range);
  }

  // ---- Public Store API (tenantId always pre-resolved by TenantResolvedGuard) ----

  getPopularProductIds(tenantId: string, limit: number) {
    return this.productClicksRepository.countTopByProduct(tenantId, limit);
  }
}
