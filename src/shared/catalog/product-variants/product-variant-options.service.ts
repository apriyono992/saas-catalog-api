import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductVariantTypesService } from './product-variant-types.service';
import {
  ProductVariantOptionsRepository,
  UpdateVariantOptionData,
} from './product-variant-options.repository';

@Injectable()
export class ProductVariantOptionsService {
  constructor(
    private readonly variantOptionsRepository: ProductVariantOptionsRepository,
    private readonly variantTypesService: ProductVariantTypesService,
  ) {}

  async findAllForType(
    tenantId: string | null,
    productId: string,
    variantTypeId: string,
  ) {
    await this.variantTypesService.findByIdForProductOrThrow(
      tenantId,
      productId,
      variantTypeId,
    );
    return this.variantOptionsRepository.findAllForType(variantTypeId);
  }

  async create(
    tenantId: string | null,
    productId: string,
    variantTypeId: string,
    value: string,
  ) {
    await this.variantTypesService.findByIdForProductOrThrow(
      tenantId,
      productId,
      variantTypeId,
    );
    return this.variantOptionsRepository.create(variantTypeId, value);
  }

  async update(
    tenantId: string | null,
    productId: string,
    variantTypeId: string,
    id: string,
    data: UpdateVariantOptionData,
  ) {
    await this.variantTypesService.findByIdForProductOrThrow(
      tenantId,
      productId,
      variantTypeId,
    );
    await this.findByIdForTypeOrThrow(variantTypeId, id);
    return this.variantOptionsRepository.update(id, variantTypeId, data);
  }

  async delete(
    tenantId: string | null,
    productId: string,
    variantTypeId: string,
    id: string,
  ) {
    await this.variantTypesService.findByIdForProductOrThrow(
      tenantId,
      productId,
      variantTypeId,
    );
    await this.findByIdForTypeOrThrow(variantTypeId, id);
    await this.variantOptionsRepository.delete(id, variantTypeId);
  }

  private async findByIdForTypeOrThrow(variantTypeId: string, id: string) {
    const option = await this.variantOptionsRepository.findByIdForType(
      id,
      variantTypeId,
    );
    if (!option) {
      throw new NotFoundException('Variant option not found');
    }
    return option;
  }
}
