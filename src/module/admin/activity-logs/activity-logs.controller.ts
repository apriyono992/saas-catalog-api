import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ActivityLogService } from '../../../shared/activity-log/activity-log.service';

@ApiTags('cms-activity-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  list(
    @CurrentTenant() tenantId: string | null,
    @Query() query: PaginationQueryDto,
  ) {
    return this.activityLogService.findAllForTenant(tenantId, query);
  }
}
