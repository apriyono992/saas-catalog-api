import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantResolvedGuard } from '../../../shared/tenant/tenant-resolved.guard';
import { TenantContextService } from '../../../shared/tenant/tenant-context.service';
import { ProductsService } from '../../../shared/catalog/products/products.service';
import { AnalyticsQueryService } from '../../../shared/analytics/analytics-query.service';
import { ListProductsQueryDto } from '../dto/list-products.query.dto';
import { PopularProductsQueryDto } from '../dto/popular-products.query.dto';
import { ProductsByIdsDto } from '../dto/products-by-ids.dto';
import {
  ProductListItemResponseDto,
  toProductListItemDto,
} from '../dto/product-list-item.response.dto';
import {
  PopularProductResponseDto,
  toPopularProductDto,
} from '../dto/popular-product.response.dto';
import { toProductDetailDto } from '../dto/product-detail.response.dto';

@ApiTags('store')
@UseGuards(TenantResolvedGuard)
@Controller('store/products')
export class ProductsController {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly productsService: ProductsService,
    private readonly analyticsQueryService: AnalyticsQueryService,
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

  @Post('by-ids')
  async byIds(
    @Body() dto: ProductsByIdsDto,
  ): Promise<ProductListItemResponseDto[]> {
    const tenantId = this.tenantContextService.getTenantIdOrThrow();
    const products = await this.productsService.findManyByIdsForTenant(
      tenantId,
      dto.ids,
    );
    return products.map(toProductListItemDto);
  }

  // Must stay before ':slug' — otherwise ':slug' would greedily match the
  // literal path segment 'popular'.
  @Get('popular')
  async popular(
    @Query() query: PopularProductsQueryDto,
  ): Promise<PopularProductResponseDto[]> {
    const tenantId = this.tenantContextService.getTenantIdOrThrow();
    const ranked = await this.analyticsQueryService.getPopularProductIds(
      tenantId,
      query.limit,
    );
    if (ranked.length === 0) {
      return [];
    }

    const productList = await this.productsService.findManyByIdsForTenant(
      tenantId,
      ranked.map((r) => r.productId),
    );
    const byId = new Map(productList.map((p) => [p.id, p]));

    return ranked
      .map((r) => {
        const product = byId.get(r.productId);
        return product ? toPopularProductDto(product, r.count) : null;
      })
      .filter((item): item is PopularProductResponseDto => item !== null);
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
