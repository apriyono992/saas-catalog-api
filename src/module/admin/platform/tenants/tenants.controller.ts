import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { DomainsRepository } from '../../../../shared/domains/domains.repository';
import { DomainsService } from '../../../../shared/domains/domains.service';
import { StoreSettingsService } from '../../../../shared/store-settings/store-settings.service';
import { TenantsService } from '../../../../shared/tenants/tenants.service';
import { UsersService } from '../../../../shared/users/users.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdatePlatformStoreSettingsDto } from './dto/update-platform-store-settings.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@ApiTags('cms-platform-tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
@Controller('cms/platform/tenants')
export class PlatformTenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly domainsRepository: DomainsRepository,
    private readonly domainsService: DomainsService,
    private readonly storeSettingsService: StoreSettingsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  list() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.tenantsService.findByIdOrThrow(id);
  }

  @Get(':id/domains')
  listDomains(@Param('id') id: string) {
    return this.domainsRepository.findAllForTenant(id);
  }

  @Post(':id/domains')
  createDomain(@Param('id') id: string, @Body() dto: { hostname: string }) {
    return this.domainsService.create(id, dto.hostname);
  }

  @Post(':id/domains/:domainId/verify')
  verifyDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
  ) {
    return this.domainsService.verify(id, domainId);
  }

  @Delete(':id/domains/:domainId')
  @HttpCode(204)
  async deleteDomain(
    @Param('id') id: string,
    @Param('domainId') domainId: string,
  ) {
    await this.domainsService.remove(id, domainId);
  }

  @Get(':id/store-settings')
  getStoreSettings(@Param('id') id: string) {
    return this.storeSettingsService.getForTenantById(id);
  }

  @Post()
  async create(@Body() dto: CreateTenantDto) {
    const tenant = await this.tenantsService.create(dto.name, dto.domain);
    if (dto.adminEmail && dto.adminPassword) {
      await this.usersService.createAdmin(tenant.id, dto.adminEmail, dto.adminPassword);
    }
    return tenant;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Patch(':id/store-settings')
  updateStoreSettings(
    @Param('id') id: string,
    @Body() dto: UpdatePlatformStoreSettingsDto,
  ) {
    return this.storeSettingsService.updateForTenantById(id, dto);
  }

  @Post(':id/store-settings/banner')
  @ApiConsumes('multipart/form-data')
  async uploadBanner(
    @Param('id') id: string,
    @Req() request: FastifyRequest,
  ) {
    const multipartFile = await request.file().catch(() => undefined);
    if (!multipartFile) throw new BadRequestException('No file uploaded');
    const buffer = await multipartFile.toBuffer().catch(() => {
      throw new BadRequestException('Failed to read uploaded file (too large?)');
    });
    return this.storeSettingsService.uploadBannerForTenant(id, {
      filename: multipartFile.filename,
      buffer,
      mimeType: multipartFile.mimetype,
    });
  }

  @Delete(':id/store-settings/banner')
  @HttpCode(204)
  async deleteBanner(@Param('id') id: string) {
    await this.storeSettingsService.deleteBannerForTenant(id);
  }

  @Post(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.tenantsService.suspend(id);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.tenantsService.activate(id);
  }
}
