import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertTenantScoped } from '../../../common/utils/assert-tenant-scoped.util';
import { isUniqueViolation } from '../../../common/utils/postgres-error.util';
import { slugify } from '../../../common/utils/slugify.util';
import { CategoriesService } from '../categories/categories.service';
import { ProductStatus, ProductsRepository } from './products.repository';

const RELATED_PRODUCTS_LIMIT = 4;

export interface FindPublishedListOptions {
  page: number;
  limit: number;
  categorySlug?: string;
  search?: string;
}

export interface FindAllForTenantOptions {
  page: number;
  limit: number;
  status?: ProductStatus;
  search?: string;
}

export interface CreateProductOptions {
  name: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  basePrice?: string;
}

export interface UpdateProductOptions {
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: string | null;
  basePrice?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
  ) {}

  // ---- Public Store API (tenantId always pre-resolved by TenantResolvedGuard) ----

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

  // ---- CMS API (tenantId comes straight from JWT via @CurrentTenant(), may be null for superadmin) ----

  findAllForTenant(tenantId: string | null, options: FindAllForTenantOptions) {
    assertTenantScoped(tenantId);
    return this.productsRepository.findAllForTenant(tenantId, options);
  }

  async findByIdForTenantOrThrow(tenantId: string | null, id: string) {
    assertTenantScoped(tenantId);
    const product = await this.productsRepository.findByIdForTenant(
      tenantId,
      id,
    );
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(tenantId: string | null, options: CreateProductOptions) {
    assertTenantScoped(tenantId);
    const slug =
      options.slug ?? (await this.generateUniqueSlug(tenantId, options.name));

    try {
      return await this.productsRepository.create(tenantId, {
        name: options.name,
        slug,
        description: options.description,
        categoryId: options.categoryId ?? null,
        basePrice: options.basePrice,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug is already in use');
      }
      throw error;
    }
  }

  async update(
    tenantId: string | null,
    id: string,
    options: UpdateProductOptions,
  ) {
    assertTenantScoped(tenantId);
    await this.findByIdForTenantOrThrow(tenantId, id);

    try {
      return await this.productsRepository.update(tenantId, id, options);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug is already in use');
      }
      throw error;
    }
  }

  async publish(tenantId: string | null, id: string) {
    assertTenantScoped(tenantId);
    await this.findByIdForTenantOrThrow(tenantId, id);
    return this.productsRepository.updateStatus(tenantId, id, 'published');
  }

  async archive(tenantId: string | null, id: string) {
    assertTenantScoped(tenantId);
    await this.findByIdForTenantOrThrow(tenantId, id);
    return this.productsRepository.updateStatus(tenantId, id, 'archived');
  }

  /** Published/archived products keep their history (clicks, etc.) — archive them instead of deleting. */
  async delete(tenantId: string | null, id: string) {
    assertTenantScoped(tenantId);
    const product = await this.findByIdForTenantOrThrow(tenantId, id);
    if (product.status !== 'draft') {
      throw new ConflictException(
        'Only draft products can be deleted — archive it instead',
      );
    }
    await this.productsRepository.delete(tenantId, id);
  }

  private async generateUniqueSlug(
    tenantId: string,
    name: string,
  ): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let suffix = 2;
    while (await this.productsRepository.existsBySlug(tenantId, candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
