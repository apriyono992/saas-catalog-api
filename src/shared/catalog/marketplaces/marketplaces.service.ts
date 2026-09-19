import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../../../common/utils/postgres-error.util';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
  type UploadedFileInput,
} from '../../storage/storage-provider.interface';
import {
  CreateMarketplaceData,
  MarketplacesRepository,
  UpdateMarketplaceData,
} from './marketplaces.repository';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

@Injectable()
export class MarketplacesService {
  constructor(
    private readonly marketplacesRepository: MarketplacesRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
  ) {}

  findAll() {
    return this.marketplacesRepository.findAll();
  }

  async findByIdOrThrow(id: string) {
    const marketplace = await this.marketplacesRepository.findById(id);
    if (!marketplace) {
      throw new NotFoundException('Marketplace not found');
    }
    return marketplace;
  }

  async create(data: { name: string; slug?: string }) {
    const slug = data.slug?.trim().toLowerCase() || this.slugify(data.name);

    try {
      return await this.marketplacesRepository.create({
        name: data.name.trim(),
        slug,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Marketplace slug is already in use');
      }
      throw error;
    }
  }

  async update(id: string, data: { name?: string; slug?: string }) {
    await this.findByIdOrThrow(id);

    const updateData: UpdateMarketplaceData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.slug !== undefined) updateData.slug = data.slug.trim().toLowerCase();

    try {
      return await this.marketplacesRepository.update(id, updateData);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Marketplace slug is already in use');
      }
      throw error;
    }
  }

  async delete(id: string) {
    const marketplace = await this.findByIdOrThrow(id);
    if (marketplace.iconUrl) {
      await this.storageProvider.delete(marketplace.iconUrl).catch(() => undefined);
    }
    await this.marketplacesRepository.delete(id);
  }

  async uploadIcon(id: string, file: UploadedFileInput) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
      throw new BadRequestException('Only JPEG, PNG, WEBP, or SVG images are allowed');
    }

    const marketplace = await this.findByIdOrThrow(id);
    const url = await this.storageProvider.upload(`marketplaces/${id}`, file);
    const updated = await this.marketplacesRepository.update(id, { iconUrl: url });

    if (marketplace.iconUrl) {
      await this.storageProvider.delete(marketplace.iconUrl).catch(() => undefined);
    }

    return updated;
  }

  async deleteIcon(id: string) {
    const marketplace = await this.findByIdOrThrow(id);
    if (marketplace.iconUrl) {
      await this.storageProvider.delete(marketplace.iconUrl).catch(() => undefined);
    }
    return this.marketplacesRepository.update(id, { iconUrl: null });
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
