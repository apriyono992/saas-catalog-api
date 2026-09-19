import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { LogActivity } from '../../../common/decorators/log-activity.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { StoreSettingsService } from '../../../shared/store-settings/store-settings.service';
import { UpdateStoreSettingsAppearanceDto } from './dto/update-store-settings-appearance.dto';
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

  @Patch('appearance')
  @LogActivity('store_settings.update_appearance', 'store_settings')
  updateAppearance(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: UpdateStoreSettingsAppearanceDto,
  ) {
    return this.storeSettingsService.updateAppearance(tenantId, dto);
  }

  @Post('banner')
  @ApiConsumes('multipart/form-data')
  @LogActivity('store_settings.upload_banner', 'store_settings')
  async uploadBanner(
    @CurrentTenant() tenantId: string | null,
    @Req() request: FastifyRequest,
  ) {
    const multipartFile = await request.file().catch(() => undefined);
    if (!multipartFile) throw new BadRequestException('No file uploaded');
    const buffer = await multipartFile.toBuffer().catch(() => {
      throw new BadRequestException('Failed to read uploaded file (too large?)');
    });
    return this.storeSettingsService.uploadBanner(tenantId, {
      filename: multipartFile.filename,
      buffer,
      mimeType: multipartFile.mimetype,
    });
  }

  @Delete('banner')
  @HttpCode(204)
  @LogActivity('store_settings.delete_banner', 'store_settings')
  async deleteBanner(@CurrentTenant() tenantId: string | null) {
    await this.storeSettingsService.deleteBanner(tenantId);
  }
}
