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
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { LogActivity } from '../../../common/decorators/log-activity.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CategoriesService } from '../../../shared/catalog/categories/categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('cms-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  list(@CurrentTenant() tenantId: string | null) {
    return this.categoriesService.findAllForTenantCms(tenantId);
  }

  @Get(':id')
  detail(@CurrentTenant() tenantId: string | null, @Param('id') id: string) {
    return this.categoriesService.findByIdForTenantOrThrow(tenantId, id);
  }

  @Post()
  @LogActivity('category.create', 'category')
  create(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenantId, dto);
  }

  @Patch(':id')
  @LogActivity('category.update', 'category')
  update(
    @CurrentTenant() tenantId: string | null,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @LogActivity('category.delete', 'category')
  async remove(
    @CurrentTenant() tenantId: string | null,
    @Param('id') id: string,
  ) {
    await this.categoriesService.delete(tenantId, id);
  }

  @Post(':id/image')
  @ApiConsumes('multipart/form-data')
  @LogActivity('category.upload_image', 'category')
  async uploadImage(
    @CurrentTenant() tenantId: string | null,
    @Param('id') id: string,
    @Req() request: FastifyRequest,
  ) {
    const multipartFile = await request.file().catch(() => undefined);
    if (!multipartFile) {
      throw new BadRequestException('No file uploaded');
    }

    const buffer = await multipartFile.toBuffer().catch(() => {
      throw new BadRequestException(
        'Failed to read uploaded file (too large?)',
      );
    });

    return this.categoriesService.uploadImage(tenantId, id, {
      filename: multipartFile.filename,
      buffer,
      mimeType: multipartFile.mimetype,
    });
  }

  @Delete(':id/image')
  @HttpCode(204)
  @LogActivity('category.delete_image', 'category')
  async removeImage(
    @CurrentTenant() tenantId: string | null,
    @Param('id') id: string,
  ) {
    await this.categoriesService.removeImage(tenantId, id);
  }
}
