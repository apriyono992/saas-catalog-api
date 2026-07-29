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
import { MarketplaceLinksService } from '../../../shared/catalog/marketplace-links/marketplace-links.service';
import { CreateMarketplaceLinkDto } from './dto/create-marketplace-link.dto';
import { UpdateMarketplaceLinkDto } from './dto/update-marketplace-link.dto';

@ApiTags('cms-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/products/:id/marketplace-links')
export class ProductMarketplaceLinksController {
  constructor(
    private readonly marketplaceLinksService: MarketplaceLinksService,
  ) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
  ) {
    return this.marketplaceLinksService.findAllForProduct(tenantId, productId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Body() dto: CreateMarketplaceLinkDto,
  ) {
    return this.marketplaceLinksService.create(tenantId, productId, dto);
  }

  @Patch(':linkId')
  update(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Param('linkId') linkId: string,
    @Body() dto: UpdateMarketplaceLinkDto,
  ) {
    return this.marketplaceLinksService.update(
      tenantId,
      productId,
      linkId,
      dto,
    );
  }

  @Delete(':linkId')
  @HttpCode(204)
  async remove(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Param('linkId') linkId: string,
  ) {
    await this.marketplaceLinksService.delete(tenantId, productId, linkId);
  }
}
