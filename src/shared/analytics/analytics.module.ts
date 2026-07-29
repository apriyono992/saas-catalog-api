import { Module } from '@nestjs/common';
import { ClickTrackingService } from './click-tracking.service';

@Module({
  providers: [ClickTrackingService],
  exports: [ClickTrackingService],
})
export class AnalyticsModule {}
