import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { LogActivity } from '../../../common/decorators/log-activity.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { StoreSettingsService } from '../../../shared/store-settings/store-settings.service';
import { UpdateStoreSettingsContactDto } from './dto/update-store-settings-contact.dto';
import { UpdateStoreSettingsSocialDto } from './dto/update-store-settings-social.dto';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';

@ApiTags('cms-store-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/store-settings')
export class StoreSettingsController {
  constructor(private readonly storeSettingsService: StoreSettingsService) {}

  @Get()
  get(@CurrentTenant() tenantId: string | null) {
    return this.storeSettingsService.getForTenant(tenantId);
  }

  @Patch()
  @LogActivity('store_settings.update', 'store_settings')
  updateGeneral(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: UpdateStoreSettingsDto,
  ) {
    return this.storeSettingsService.updateGeneral(tenantId, dto);
  }

  @Patch('contact')
  @LogActivity('store_settings.update_contact', 'store_settings')
  updateContact(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: UpdateStoreSettingsContactDto,
  ) {
    return this.storeSettingsService.updateContact(tenantId, dto);
  }

  @Patch('social')
  @LogActivity('store_settings.update_social', 'store_settings')
  updateSocial(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: UpdateStoreSettingsSocialDto,
  ) {
    return this.storeSettingsService.updateSocial(tenantId, dto);
  }
}
