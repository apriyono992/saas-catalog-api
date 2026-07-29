import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
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
  create(
    @CurrentTenant() tenantId: string | null,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(tenantId, dto);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string | null,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentTenant() tenantId: string | null,
    @Param('id') id: string,
  ) {
    await this.categoriesService.delete(tenantId, id);
  }
}
