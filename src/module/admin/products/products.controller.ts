import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { LogActivity } from '../../../common/decorators/log-activity.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProductsService } from '../../../shared/catalog/products/products.service';
import { AdminListProductsQueryDto } from './dto/admin-list-products.query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('cms-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string | null,
    @Query() query: AdminListProductsQueryDto,
  ) {
    return this.productsService.findAllForTenant(tenantId, query);
  }

  @Get(':id')
  detail(@CurrentTenant() tenantId: string | null, @Param('id') id: string) {
    return this.productsService.findByIdForTenantOrThrow(tenantId, id);
  }

  @Post()
  @LogActivity('product.create', 'product')
  create(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(tenantId, dto);
  }

  @Patch(':id')
  @LogActivity('product.update', 'product')
  update(
    @CurrentTenant() tenantId: string | null,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @LogActivity('product.delete', 'product')
  async remove(
    @CurrentTenant() tenantId: string | null,
    @Param('id') id: string,
  ) {
    await this.productsService.delete(tenantId, id);
  }

  @Post(':id/publish')
  @LogActivity('product.publish', 'product')
  publish(@CurrentTenant() tenantId: string | null, @Param('id') id: string) {
    return this.productsService.publish(tenantId, id);
  }

  @Post(':id/archive')
  @LogActivity('product.archive', 'product')
  archive(@CurrentTenant() tenantId: string | null, @Param('id') id: string) {
    return this.productsService.archive(tenantId, id);
  }
}
