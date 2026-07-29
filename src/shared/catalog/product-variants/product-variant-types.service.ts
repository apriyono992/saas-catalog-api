import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import {
  ProductVariantTypesRepository,
  UpdateVariantTypeData,
} from './product-variant-types.repository';

@Injectable()
export class ProductVariantTypesService {
  constructor(
    private readonly variantTypesRepository: ProductVariantTypesRepository,
    private readonly productsService: ProductsService,
  ) {}

  async findAllForProduct(tenantId: string | null, productId: string) {
    await this.productsService.findByIdForTenantOrThrow(tenantId, productId);
    return this.variantTypesRepository.findAllForProduct(productId);
  }

  async findByIdForProductOrThrow(
    tenantId: string | null,
    productId: string,
    id: string,
  ) {
    await this.productsService.findByIdForTenantOrThrow(tenantId, productId);
    const variantType = await this.variantTypesRepository.findByIdForProduct(
      id,
      productId,
    );
    if (!variantType) {
      throw new NotFoundException('Variant type not found');
    }
    return variantType;
  }

  async create(tenantId: string | null, productId: string, name: string) {
    await this.productsService.findByIdForTenantOrThrow(tenantId, productId);
    return this.variantTypesRepository.create(productId, name);
  }

  async update(
    tenantId: string | null,
    productId: string,
    id: string,
    data: UpdateVariantTypeData,
  ) {
    await this.findByIdForProductOrThrow(tenantId, productId, id);
    return this.variantTypesRepository.update(id, productId, data);
  }

  async delete(tenantId: string | null, productId: string, id: string) {
    await this.findByIdForProductOrThrow(tenantId, productId, id);
    await this.variantTypesRepository.delete(id, productId);
  }
}
