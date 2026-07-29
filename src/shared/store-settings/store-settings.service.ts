import { Injectable } from '@nestjs/common';
import { StoreSettingsRepository } from './store-settings.repository';

@Injectable()
export class StoreSettingsService {
  constructor(
    private readonly storeSettingsRepository: StoreSettingsRepository,
  ) {}

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
    };
  }
}
