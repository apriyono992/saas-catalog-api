import { Injectable } from '@nestjs/common';
import { assertTenantScoped } from '../../common/utils/assert-tenant-scoped.util';
import {
  StoreSettingsPatch,
  StoreSettingsRepository,
} from './store-settings.repository';

@Injectable()
export class StoreSettingsService {
  constructor(
    private readonly storeSettingsRepository: StoreSettingsRepository,
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
    };
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
}
