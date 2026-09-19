import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertTenantScoped } from '../../../common/utils/assert-tenant-scoped.util';
import { isUniqueViolation } from '../../../common/utils/postgres-error.util';
import { slugify } from '../../../common/utils/slugify.util';
import { StoreSettingsRepository } from '../../store-settings/store-settings.repository';
import { CategoriesService } from '../categories/categories.service';
import { ProductStatus, ProductsRepository, UpdateProductData } from './products.repository';

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
  categoryId?: string;
}

export interface CreateProductOptions {
  name: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  categoryIds?: string[];
  basePrice?: string;
  strikePrice?: string | null;
}

export interface UpdateProductOptions {
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: string | null;
  categoryIds?: string[];
  basePrice?: string;
  strikePrice?: string | null;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly storeSettingsRepository: StoreSettingsRepository,
  ) {}

  // ---- Public Store API (tenantId always pre-resolved by TenantResolvedGuard) ----

  async findPublishedList(tenantId: string, options: FindPublishedListOptions) {
    const { page, limit, categorySlug, search } = options;

    let categoryIds: string[] | undefined;
    if (categorySlug) {
      const category = await this.categoriesService.findBySlugForTenant(
        tenantId,
        categorySlug,
      );
      if (!category) {
        return { items: [], total: 0, page, limit };
      }
      categoryIds = await this.categoriesService.getDescendantCategoryIds(
        tenantId,
        category.id,
      );
    }

    const { items, total } = await this.productsRepository.findPublishedList(
      tenantId,
      { page, limit, categoryIds, search },
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

  async findManyByIdsForTenant(tenantId: string, ids: string[]) {
    if (ids.length === 0) {
      return [];
    }
    return this.productsRepository.findManyByIdsForTenant(tenantId, ids);
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

  async findAllForTenant(tenantId: string | null, options: FindAllForTenantOptions) {
    assertTenantScoped(tenantId);
    let categoryIds: string[] | undefined;
    if (options.categoryId) {
      categoryIds = await this.categoriesService.getDescendantCategoryIds(
        tenantId,
        options.categoryId,
      );
    }
    return this.productsRepository.findAllForTenant(tenantId, {
      ...options,
      categoryIds,
    });
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

    let strikePrice = options.strikePrice;
    if (strikePrice === undefined || strikePrice === '') {
      const settings = await this.storeSettingsRepository.findByTenantId(tenantId);
      const pct = parseInt(settings?.defaultStrikePercentage ?? '35', 10);
      if (pct > 0 && options.basePrice && Number(options.basePrice) > 0) {
        strikePrice = Math.round(Number(options.basePrice) * (1 + pct / 100)).toFixed(2);
      } else {
        strikePrice = null;
      }
    }

    const effectiveCategoryIds =
      options.categoryIds ?? (options.categoryId ? [options.categoryId] : []);
    const primaryCategoryId =
      effectiveCategoryIds[0] ?? options.categoryId ?? null;

    try {
      return await this.productsRepository.create(tenantId, {
        name: options.name,
        slug,
        description: options.description,
        categoryId: primaryCategoryId,
        categoryIds: effectiveCategoryIds,
        basePrice: options.basePrice,
        strikePrice,
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
    const existing = await this.findByIdForTenantOrThrow(tenantId, id);

    const updatePayload: UpdateProductData = {
      name: options.name,
      slug: options.slug,
      description: options.description,
      categoryId: options.categoryIds
        ? options.categoryIds[0] ?? null
        : options.categoryId,
      categoryIds: options.categoryIds,
      basePrice: options.basePrice,
    };

    if (options.strikePrice !== undefined) {
      if (options.strikePrice === '' || options.strikePrice === null) {
        const basePrice = options.basePrice ?? existing.basePrice;
        const settings = await this.storeSettingsRepository.findByTenantId(tenantId);
        const pct = parseInt(settings?.defaultStrikePercentage ?? '35', 10);
        if (pct > 0 && basePrice && Number(basePrice) > 0) {
          updatePayload.strikePrice = Math.round(Number(basePrice) * (1 + pct / 100)).toFixed(2);
        } else {
          updatePayload.strikePrice = null;
        }
      } else {
        updatePayload.strikePrice = options.strikePrice;
      }
    }

    try {
      return await this.productsRepository.update(tenantId, id, updatePayload);
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

  async delete(tenantId: string | null, id: string) {
    assertTenantScoped(tenantId);
    await this.findByIdForTenantOrThrow(tenantId, id);
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
