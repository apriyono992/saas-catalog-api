import { Injectable, NotFoundException } from '@nestjs/common';
import { MarketplaceLinksRepository } from './marketplace-links.repository';

@Injectable()
export class MarketplaceLinksService {
  constructor(
    private readonly marketplaceLinksRepository: MarketplaceLinksRepository,
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
}
