import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import {
  CreateMarketplaceLinkData,
  MarketplaceLinksRepository,
  UpdateMarketplaceLinkData,
} from './marketplace-links.repository';

@Injectable()
export class MarketplaceLinksService {
  constructor(
    private readonly marketplaceLinksRepository: MarketplaceLinksRepository,
    private readonly productsService: ProductsService,
  ) {}

  async findByIdForTenantOrThrow(id: string, tenantId: string) {
    const link = await this.marketplaceLinksRepository.findByIdForTenant(
      id,
      tenantId,
    );
    if (!link) {
      throw new NotFoundException('Marketplace link not found');
    }
    return link;
  }

  async findAllForProduct(tenantId: string | null, productId: string) {
    await this.productsService.findByIdForTenantOrThrow(tenantId, productId);
    return this.marketplaceLinksRepository.findAllForProduct(productId);
  }

  async findByIdForProductOrThrow(
    tenantId: string | null,
    productId: string,
    id: string,
  ) {
    await this.productsService.findByIdForTenantOrThrow(tenantId, productId);
    const link = await this.marketplaceLinksRepository.findByIdForProduct(
      id,
      productId,
    );
    if (!link) {
      throw new NotFoundException('Marketplace link not found');
    }
    return link;
  }

  async create(
    tenantId: string | null,
    productId: string,
    data: CreateMarketplaceLinkData,
  ) {
    await this.productsService.findByIdForTenantOrThrow(tenantId, productId);
    return this.marketplaceLinksRepository.create(productId, data);
  }

  async update(
    tenantId: string | null,
    productId: string,
    id: string,
    data: UpdateMarketplaceLinkData,
  ) {
    await this.findByIdForProductOrThrow(tenantId, productId, id);
    return this.marketplaceLinksRepository.update(id, productId, data);
  }

  async delete(tenantId: string | null, productId: string, id: string) {
    await this.findByIdForProductOrThrow(tenantId, productId, id);
    await this.marketplaceLinksRepository.delete(id, productId);
  }
}
