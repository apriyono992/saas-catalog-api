import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ProductImagesService } from '../../../shared/catalog/product-images/product-images.service';
import { ReorderImagesDto } from './dto/reorder-images.dto';

@ApiTags('cms-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cms/products/:id/images')
export class ProductImagesController {
  constructor(private readonly productImagesService: ProductImagesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  async upload(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
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

    return this.productImagesService.upload(tenantId, productId, {
      filename: multipartFile.filename,
      buffer,
      mimeType: multipartFile.mimetype,
    });
  }

  @Patch('reorder')
  @HttpCode(204)
  async reorder(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Body() dto: ReorderImagesDto,
  ) {
    await this.productImagesService.reorder(tenantId, productId, dto.imageIds);
  }

  @Delete(':imageId')
  @HttpCode(204)
  async remove(
    @CurrentTenant() tenantId: string | null,
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
  ) {
    await this.productImagesService.remove(tenantId, productId, imageId);
  }
}
