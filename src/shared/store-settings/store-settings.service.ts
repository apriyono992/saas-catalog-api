import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { assertTenantScoped } from '../../common/utils/assert-tenant-scoped.util';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
  type UploadedFileInput,
} from '../storage/storage-provider.interface';
import {
  StoreSettingsPatch,
  StoreSettingsRepository,
} from './store-settings.repository';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

@Injectable()
export class StoreSettingsService {
  constructor(
    private readonly storeSettingsRepository: StoreSettingsRepository,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
  ) {}

  // ---- Public Store API ----

  async findByTenantId(tenantId: string) {
    const settings =
      await this.storeSettingsRepository.findByTenantId(tenantId);

    return {
      description: settings?.description ?? null,
      contactEmail: settings?.contactEmail ?? null,
      contactPhone: settings?.contactPhone ?? null,
      socialInstagram: settings?.socialInstagram ?? null,
      socialFacebook: settings?.socialFacebook ?? null,
      socialTiktok: settings?.socialTiktok ?? null,
      socialWhatsapp: settings?.socialWhatsapp ?? null,
      bannerUrl: settings?.bannerUrl ?? null,
      navbarColor: settings?.navbarColor ?? null,
      buttonColor: settings?.buttonColor ?? null,
      buttonTextColor: settings?.buttonTextColor ?? null,
      categoryTitle: settings?.categoryTitle ?? null,
      cardColor: settings?.cardColor ?? null,
      cardSectionColor: settings?.cardSectionColor ?? null,
      defaultStrikePercentage: settings?.defaultStrikePercentage ?? '35',
    };
  }

  // ---- Platform API (superadmin managing store settings for any tenant by id) ----

  async getForTenantById(tenantId: string) {
    const settings = await this.storeSettingsRepository.findByTenantId(tenantId);
    return settings ?? this.storeSettingsRepository.upsert(tenantId, {});
  }

  updateForTenantById(tenantId: string, data: StoreSettingsPatch) {
    return this.storeSettingsRepository.upsert(tenantId, data);
  }

  async uploadBannerForTenant(tenantId: string, file: UploadedFileInput) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
      throw new BadRequestException('Only JPEG, PNG, WEBP, GIF, or SVG images are allowed');
    }
    const current = await this.storeSettingsRepository.findByTenantId(tenantId);
    const url = await this.storageProvider.upload(`banners/${tenantId}`, file);
    const updated = await this.storeSettingsRepository.upsert(tenantId, { bannerUrl: url });
    if (current?.bannerUrl) {
      await this.storageProvider.delete(current.bannerUrl).catch(() => undefined);
    }
    return updated;
  }

  async deleteBannerForTenant(tenantId: string) {
    const current = await this.storeSettingsRepository.findByTenantId(tenantId);
    if (current?.bannerUrl) {
      await this.storageProvider.delete(current.bannerUrl).catch(() => undefined);
    }
    return this.storeSettingsRepository.upsert(tenantId, { bannerUrl: null });
  }

  // ---- CMS API (tenantId comes straight from JWT via @CurrentTenant(), may be null for superadmin) ----

  async getForTenant(tenantId: string | null) {
    assertTenantScoped(tenantId);
    const settings =
      await this.storeSettingsRepository.findByTenantId(tenantId);
    return settings ?? this.storeSettingsRepository.upsert(tenantId, {});
  }

  updateGeneral(
    tenantId: string | null,
    data: Pick<StoreSettingsPatch, 'description'>,
  ) {
    assertTenantScoped(tenantId);
    return this.storeSettingsRepository.upsert(tenantId, data);
  }

  updateContact(
    tenantId: string | null,
    data: Pick<StoreSettingsPatch, 'contactEmail' | 'contactPhone'>,
  ) {
    assertTenantScoped(tenantId);
    return this.storeSettingsRepository.upsert(tenantId, data);
  }

  updateSocial(
    tenantId: string | null,
    data: Pick<
      StoreSettingsPatch,
      'socialInstagram' | 'socialFacebook' | 'socialTiktok' | 'socialWhatsapp'
    >,
  ) {
    assertTenantScoped(tenantId);
    return this.storeSettingsRepository.upsert(tenantId, data);
  }

  updateAppearance(
    tenantId: string | null,
    data: Pick<
      StoreSettingsPatch,
      | 'navbarColor'
      | 'buttonColor'
      | 'buttonTextColor'
      | 'bannerUrl'
      | 'categoryTitle'
      | 'cardColor'
      | 'cardSectionColor'
      | 'defaultStrikePercentage'
    >,
  ) {
    assertTenantScoped(tenantId);
    return this.storeSettingsRepository.upsert(tenantId, data);
  }

  async uploadBanner(tenantId: string | null, file: UploadedFileInput) {
    assertTenantScoped(tenantId);
    return this.uploadBannerForTenant(tenantId, file);
  }

  async deleteBanner(tenantId: string | null) {
    assertTenantScoped(tenantId);
    return this.deleteBannerForTenant(tenantId);
  }
}
