import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import { storeSettings } from '../../database/schema';

export interface StoreSettingsPatch {
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialTiktok?: string;
  socialWhatsapp?: string;
  bannerUrl?: string | null;
  navbarColor?: string | null;
  buttonColor?: string | null;
  buttonTextColor?: string | null;
  categoryTitle?: string | null;
  cardColor?: string | null;
  cardSectionColor?: string | null;
  defaultStrikePercentage?: string | null;
}

@Injectable()
export class StoreSettingsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  findByTenantId(tenantId: string) {
    return this.db.query.storeSettings.findFirst({
      where: eq(storeSettings.tenantId, tenantId),
    });
  }

  /** Self-heals tenants that predate the auto-create-on-tenant-creation transaction. */
  async upsert(tenantId: string, data: StoreSettingsPatch) {
    const [result] = await this.db
      .insert(storeSettings)
      .values({ tenantId, ...data })
      .onConflictDoUpdate({
        target: storeSettings.tenantId,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return result;
  }
}
