import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AnalyticsQueryService } from '../../../shared/analytics/analytics-query.service';
import { AnalyticsDateRangeQueryDto } from './dto/analytics-date-range.query.dto';

@ApiTags('cms-analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/analytics/clicks')
export class AnalyticsController {
  constructor(private readonly analyticsQueryService: AnalyticsQueryService) {}

  @Get()
  total(
    @CurrentTenant() tenantId: string | null,
    @Query() query: AnalyticsDateRangeQueryDto,
  ) {
    return this.analyticsQueryService.getTotalClicks(
      tenantId,
      this.toRange(query),
    );
  }

  @Get('by-product')
  byProduct(
    @CurrentTenant() tenantId: string | null,
    @Query() query: AnalyticsDateRangeQueryDto,
  ) {
    return this.analyticsQueryService.getClicksByProduct(
      tenantId,
      this.toRange(query),
    );
  }

  @Get('by-marketplace')
  byMarketplace(
    @CurrentTenant() tenantId: string | null,
    @Query() query: AnalyticsDateRangeQueryDto,
  ) {
    return this.analyticsQueryService.getClicksByMarketplace(
      tenantId,
      this.toRange(query),
    );
  }

  private toRange(query: AnalyticsDateRangeQueryDto) {
    return {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
  }
}
