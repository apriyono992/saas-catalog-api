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
import { ProductVariantOptionsService } from '../../../shared/catalog/product-variants/product-variant-options.service';
import { CreateVariantOptionDto } from './dto/create-variant-option.dto';
import { UpdateVariantOptionDto } from './dto/update-variant-option.dto';

@ApiTags('cms-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/products/:id/variant-types/:typeId/options')
export class ProductVariantOptionsController {
  constructor(
    private readonly variantOptionsService: ProductVariantOptionsService,
  ) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Param('typeId') typeId: string,
  ) {
    return this.variantOptionsService.findAllForType(
      tenantId,
      productId,
      typeId,
    );
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Param('typeId') typeId: string,
    @Body() dto: CreateVariantOptionDto,
  ) {
    return this.variantOptionsService.create(
      tenantId,
      productId,
      typeId,
      dto.value,
    );
  }

  @Patch(':optionId')
  update(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Param('typeId') typeId: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateVariantOptionDto,
  ) {
    return this.variantOptionsService.update(
      tenantId,
      productId,
      typeId,
      optionId,
      dto,
    );
  }

  @Delete(':optionId')
  @HttpCode(204)
  async remove(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Param('typeId') typeId: string,
    @Param('optionId') optionId: string,
  ) {
    await this.variantOptionsService.delete(
      tenantId,
      productId,
      typeId,
      optionId,
    );
  }
}
