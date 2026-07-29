import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLogInterceptor } from '../../common/interceptors/activity-log.interceptor';
import { ActivityLogRepository } from './activity-log.repository';
import { ActivityLogService } from './activity-log.service';

@Module({
  providers: [
    ActivityLogRepository,
    ActivityLogService,
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
