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
  parentId?: string | null;
}

export interface UpdateCategoryOptions {
  name?: string;
  slug?: string;
  parentId?: string | null;
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

  findRootsForTenant(tenantId: string) {
    return this.categoriesRepository.findRootsForTenant(tenantId);
  }

  findChildrenForTenant(tenantId: string, parentId: string) {
    return this.categoriesRepository.findChildrenForTenant(tenantId, parentId);
  }

  findBySlugForTenant(tenantId: string, slug: string) {
    return this.categoriesRepository.findBySlugForTenant(tenantId, slug);
  }

  async getCategoryDetailForStore(tenantId: string, slug: string) {
    const category = await this.categoriesRepository.findBySlugForTenant(
      tenantId,
      slug,
    );
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const [depth, ancestors, children] = await Promise.all([
      this.categoriesRepository.getCategoryDepth(tenantId, category.id),
      this.categoriesRepository.getAncestors(tenantId, category.id),
      this.categoriesRepository.findChildrenForTenant(tenantId, category.id),
    ]);

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      depth,
      ancestors,
      children: children.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
      })),
    };
  }

  async getDescendantCategoryIds(tenantId: string, categoryId: string) {
    return this.categoriesRepository.getDescendantCategoryIds(tenantId, categoryId);
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
    await this.validateMaxDepth(tenantId, options.parentId);

    const slug =
      options.slug ?? (await this.generateUniqueSlug(tenantId, options.name));

    try {
      return await this.categoriesRepository.create(tenantId, {
        name: options.name,
        slug,
        parentId: options.parentId || null,
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

    if (options.parentId !== undefined) {
      await this.validateMaxDepth(tenantId, options.parentId, id);
    }

    try {
      return await this.categoriesRepository.update(tenantId, id, {
        name: options.name,
        slug: options.slug,
        parentId: options.parentId === '' ? null : options.parentId,
      });
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

  private async validateMaxDepth(
    tenantId: string,
    parentId?: string | null,
    updatingId?: string,
  ) {
    if (!parentId) return;

    if (updatingId && parentId === updatingId) {
      throw new BadRequestException(
        'Kategori tidak bisa menjadi subkategori bagi dirinya sendiri',
      );
    }

    if (updatingId) {
      const descendants = await this.categoriesRepository.getDescendantCategoryIds(
        tenantId,
        updatingId,
      );
      if (descendants.includes(parentId)) {
        throw new BadRequestException(
          'Tidak dapat memilih subkategori dari kategori ini sebagai kategori induk',
        );
      }
    }

    const parent = await this.categoriesRepository.findByIdForTenant(
      tenantId,
      parentId,
    );
    if (!parent) {
      throw new BadRequestException('Kategori induk tidak ditemukan');
    }

    const parentDepth = await this.categoriesRepository.getCategoryDepth(
      tenantId,
      parentId,
    );
    if (parentDepth >= 5) {
      throw new BadRequestException(
        'Maksimal 5 tingkat subkategori tercapai. Tidak dapat menambahkan subkategori lebih dalam.',
      );
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
