import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { DomainsService } from '../../../shared/domains/domains.service';
import { CreateDomainDto } from './dto/create-domain.dto';

@ApiTags('cms-domains')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  list(@CurrentTenant() tenantId: string | null) {
    return this.domainsService.listForTenant(tenantId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: CreateDomainDto,
  ) {
    return this.domainsService.create(tenantId, dto.hostname);
  }

  @Post(':id/verify')
  verify(@CurrentTenant() tenantId: string | null, @Param('id') id: string) {
    return this.domainsService.verify(tenantId, id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentTenant() tenantId: string | null,
    @Param('id') id: string,
  ) {
    await this.domainsService.remove(tenantId, id);
  }
}
