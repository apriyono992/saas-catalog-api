import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantResolvedGuard } from '../../../shared/tenant/tenant-resolved.guard';
import { TenantContextService } from '../../../shared/tenant/tenant-context.service';
import { CategoriesService } from '../../../shared/catalog/categories/categories.service';
import { toCategoryListItemDto } from '../dto/category-list-item.response.dto';

@ApiTags('store')
@UseGuards(TenantResolvedGuard)
@Controller('store/categories')
export class CategoriesController {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get()
  async list() {
    const tenantId = this.tenantContextService.getTenantIdOrThrow();
    const categories = await this.categoriesService.findAllForTenant(tenantId);
    return categories.map(toCategoryListItemDto);
  }
}
