import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertTenantScoped } from '../../../common/utils/assert-tenant-scoped.util';
import { isUniqueViolation } from '../../../common/utils/postgres-error.util';
import { slugify } from '../../../common/utils/slugify.util';
import { STORAGE_PROVIDER } from '../../storage/storage-provider.interface';
import type {
  StorageProvider,
  UploadedFileInput,
} from '../../storage/storage-provider.interface';
import { CategoriesRepository } from './categories.repository';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface CreateCategoryOptions {
  name: string;
  slug?: string;
}

export interface UpdateCategoryOptions {
  name?: string;
  slug?: string;
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {}

  findAllForTenant(tenantId: string) {
    return this.categoriesRepository.findAllForTenant(tenantId);
  }

  findBySlugForTenant(tenantId: string, slug: string) {
    return this.categoriesRepository.findBySlugForTenant(tenantId, slug);
  }

  // ---- CMS API (tenantId comes straight from JWT via @CurrentTenant(), may be null for superadmin) ----

  findAllForTenantCms(tenantId: string | null) {
    assertTenantScoped(tenantId);
    return this.categoriesRepository.findAllForTenant(tenantId);
  }

  async findByIdForTenantOrThrow(tenantId: string | null, id: string) {
    assertTenantScoped(tenantId);
    const category = await this.categoriesRepository.findByIdForTenant(
      tenantId,
      id,
    );
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(tenantId: string | null, options: CreateCategoryOptions) {
    assertTenantScoped(tenantId);
    const slug =
      options.slug ?? (await this.generateUniqueSlug(tenantId, options.name));

    try {
      return await this.categoriesRepository.create(tenantId, {
        name: options.name,
        slug,
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
    options: UpdateCategoryOptions,
  ) {
    assertTenantScoped(tenantId);
    await this.findByIdForTenantOrThrow(tenantId, id);

    try {
      return await this.categoriesRepository.update(tenantId, id, options);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug is already in use');
      }
      throw error;
    }
  }

  async delete(tenantId: string | null, id: string) {
    assertTenantScoped(tenantId);
    await this.findByIdForTenantOrThrow(tenantId, id);
    await this.categoriesRepository.delete(tenantId, id);
  }

  async uploadImage(
    tenantId: string | null,
    id: string,
    file: UploadedFileInput,
  ) {
    assertTenantScoped(tenantId);
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
      throw new BadRequestException(
        'Only JPEG, PNG, or WEBP images are allowed',
      );
    }

    const category = await this.findByIdForTenantOrThrow(tenantId, id);
    const url = await this.storageProvider.upload(`categories/${id}`, file);
    const updated = await this.categoriesRepository.update(tenantId, id, {
      imageUrl: url,
    });

    if (category.imageUrl) {
      await this.storageProvider.delete(category.imageUrl);
    }

    return updated;
  }

  async removeImage(tenantId: string | null, id: string) {
    assertTenantScoped(tenantId);
    const category = await this.findByIdForTenantOrThrow(tenantId, id);
    await this.categoriesRepository.update(tenantId, id, { imageUrl: null });

    if (category.imageUrl) {
      await this.storageProvider.delete(category.imageUrl);
    }
  }

  private async generateUniqueSlug(
    tenantId: string,
    name: string,
  ): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let suffix = 2;
    while (await this.categoriesRepository.existsBySlug(tenantId, candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
