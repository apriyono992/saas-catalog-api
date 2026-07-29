import {
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createHash } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { TenantResolvedGuard } from '../../../shared/tenant/tenant-resolved.guard';
import { TenantContextService } from '../../../shared/tenant/tenant-context.service';
import { MarketplaceLinksService } from '../../../shared/catalog/marketplace-links/marketplace-links.service';
import { ClickTrackingService } from '../../../shared/analytics/click-tracking.service';

@ApiTags('store')
@UseGuards(TenantResolvedGuard)
@Controller('store/marketplace')
export class MarketplaceController {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly marketplaceLinksService: MarketplaceLinksService,
    private readonly clickTrackingService: ClickTrackingService,
  ) {}

  @Post(':linkId/redirect')
  @HttpCode(200)
  async redirect(
    @Param('linkId') linkId: string,
    @Req() request: FastifyRequest,
  ) {
    const tenantId = this.tenantContextService.getTenantIdOrThrow();
    const link = await this.marketplaceLinksService.findByIdForTenantOrThrow(
      linkId,
      tenantId,
    );

    await this.clickTrackingService.recordClick({
      tenantId,
      productId: link.productId,
      marketplaceLinkId: link.id,
      ipHash: this.hashIp(request),
      userAgent: request.headers['user-agent']?.slice(0, 255),
    });

    return { url: link.url };
  }

  private hashIp(request: FastifyRequest): string | undefined {
    const forwardedFor = request.headers['x-forwarded-for'];
    const raw = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0].trim();
    const ip = raw ?? request.ip;

    return ip ? createHash('sha256').update(ip).digest('hex') : undefined;
  }
}
