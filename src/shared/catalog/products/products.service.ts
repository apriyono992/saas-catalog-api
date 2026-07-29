import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { ProductsRepository } from './products.repository';

const RELATED_PRODUCTS_LIMIT = 4;

export interface FindPublishedListOptions {
  page: number;
  limit: number;
  categorySlug?: string;
  search?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  async findPublishedList(tenantId: string, options: FindPublishedListOptions) {
    const { page, limit, categorySlug, search } = options;

    let categoryId: string | undefined;
    if (categorySlug) {
      const category = await this.categoriesService.findBySlugForTenant(
        tenantId,
        categorySlug,
      );
      if (!category) {
        return { items: [], total: 0, page, limit };
      }
      categoryId = category.id;
    }

    const { items, total } = await this.productsRepository.findPublishedList(
      tenantId,
      { page, limit, categoryId, search },
    );

    return { items, total, page, limit };
  }

  async findPublishedBySlugOrThrow(tenantId: string, slug: string) {
    const product = await this.productsRepository.findPublishedBySlug(
      tenantId,
      slug,
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findRelated(tenantId: string, slug: string) {
    const product = await this.findPublishedBySlugOrThrow(tenantId, slug);
    if (!product.categoryId) {
      return [];
    }
    return this.productsRepository.findRelated(
      tenantId,
      product.categoryId,
      product.id,
      RELATED_PRODUCTS_LIMIT,
    );
  }
}
