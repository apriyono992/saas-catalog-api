import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { MarketplacesService } from '../../../shared/catalog/marketplaces/marketplaces.service';

@ApiTags('cms-marketplaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/marketplaces')
export class MarketplacesController {
  constructor(private readonly marketplacesService: MarketplacesService) {}

  @Get()
  list() {
    return this.marketplacesService.findAll();
  }
}
