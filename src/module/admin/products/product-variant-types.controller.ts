import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProductVariantTypesService } from '../../../shared/catalog/product-variants/product-variant-types.service';
import { CreateVariantTypeDto } from './dto/create-variant-type.dto';
import { UpdateVariantTypeDto } from './dto/update-variant-type.dto';

@ApiTags('cms-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/products/:id/variant-types')
export class ProductVariantTypesController {
  constructor(
    private readonly variantTypesService: ProductVariantTypesService,
  ) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
  ) {
    return this.variantTypesService.findAllForProduct(tenantId, productId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Body() dto: CreateVariantTypeDto,
  ) {
    return this.variantTypesService.create(tenantId, productId, dto.name);
  }

  @Patch(':typeId')
  update(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Param('typeId') typeId: string,
    @Body() dto: UpdateVariantTypeDto,
  ) {
    return this.variantTypesService.update(tenantId, productId, typeId, dto);
  }

  @Delete(':typeId')
  @HttpCode(204)
  async remove(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Param('typeId') typeId: string,
  ) {
    await this.variantTypesService.delete(tenantId, productId, typeId);
  }
}
