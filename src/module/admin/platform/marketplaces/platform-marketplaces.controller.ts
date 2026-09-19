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
import { LogActivity } from '../../../../common/decorators/log-activity.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { MarketplacesService } from '../../../../shared/catalog/marketplaces/marketplaces.service';
import { CreateMarketplaceDto } from './dto/create-marketplace.dto';
import { UpdateMarketplaceDto } from './dto/update-marketplace.dto';

@ApiTags('cms-platform-marketplaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
@Controller('cms/platform/marketplaces')
export class PlatformMarketplacesController {
  constructor(private readonly marketplacesService: MarketplacesService) {}

  @Get()
  list() {
    return this.marketplacesService.findAll();
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.marketplacesService.findByIdOrThrow(id);
  }

  @Post()
  @LogActivity('marketplace.create', 'marketplace')
  create(@Body() dto: CreateMarketplaceDto) {
    return this.marketplacesService.create(dto);
  }

  @Patch(':id')
  @LogActivity('marketplace.update', 'marketplace')
  update(@Param('id') id: string, @Body() dto: UpdateMarketplaceDto) {
    return this.marketplacesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @LogActivity('marketplace.delete', 'marketplace')
  async delete(@Param('id') id: string) {
    await this.marketplacesService.delete(id);
  }

  @Post(':id/icon')
  @ApiConsumes('multipart/form-data')
  @LogActivity('marketplace.upload_icon', 'marketplace')
  async uploadIcon(@Param('id') id: string, @Req() request: FastifyRequest) {
    const multipartFile = await request.file().catch(() => undefined);
    if (!multipartFile) throw new BadRequestException('No file uploaded');
    const buffer = await multipartFile.toBuffer().catch(() => {
      throw new BadRequestException('Failed to read uploaded file (too large?)');
    });
    return this.marketplacesService.uploadIcon(id, {
      filename: multipartFile.filename,
      buffer,
      mimeType: multipartFile.mimetype,
    });
  }

  @Delete(':id/icon')
  @HttpCode(204)
  @LogActivity('marketplace.delete_icon', 'marketplace')
  async deleteIcon(@Param('id') id: string) {
    await this.marketplacesService.deleteIcon(id);
  }
}
