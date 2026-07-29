import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import { storeSettings } from '../../database/schema';

@Injectable()
export class StoreSettingsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  findByTenantId(tenantId: string) {
    return this.db.query.storeSettings.findFirst({
      where: eq(storeSettings.tenantId, tenantId),
    });
  }
}
