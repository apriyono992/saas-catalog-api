import { Module } from '@nestjs/common';
import { ClickTrackingService } from './click-tracking.service';
import { ProductClicksRepository } from './product-clicks.repository';
import { AnalyticsQueryService } from './analytics-query.service';

@Module({
  providers: [
    ClickTrackingService,
    ProductClicksRepository,
    AnalyticsQueryService,
  ],
  exports: [ClickTrackingService, AnalyticsQueryService],
})
export class AnalyticsModule {}
