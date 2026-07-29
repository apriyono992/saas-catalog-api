import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantResolvedGuard } from '../../../shared/tenant/tenant-resolved.guard';
import { TenantContextService } from '../../../shared/tenant/tenant-context.service';
import { ProductsService } from '../../../shared/catalog/products/products.service';
import { ListProductsQueryDto } from '../dto/list-products.query.dto';
import { toProductListItemDto } from '../dto/product-list-item.response.dto';
import { toProductDetailDto } from '../dto/product-detail.response.dto';

@ApiTags('store')
@UseGuards(TenantResolvedGuard)
@Controller('store/products')
export class ProductsController {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  async list(@Query() query: ListProductsQueryDto) {
    const tenantId = this.tenantContextService.getTenantIdOrThrow();
    const { items, total, page, limit } =
      await this.productsService.findPublishedList(tenantId, {
        page: query.page,
        limit: query.limit,
        categorySlug: query.category,
        search: query.search,
      });

    return {
      data: items.map(toProductListItemDto),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    const tenantId = this.tenantContextService.getTenantIdOrThrow();
    const product = await this.productsService.findPublishedBySlugOrThrow(
      tenantId,
      slug,
    );
    return toProductDetailDto(product);
  }

  @Get(':slug/related')
  async related(@Param('slug') slug: string) {
    const tenantId = this.tenantContextService.getTenantIdOrThrow();
    const related = await this.productsService.findRelated(tenantId, slug);
    return related.map(toProductListItemDto);
  }
}
