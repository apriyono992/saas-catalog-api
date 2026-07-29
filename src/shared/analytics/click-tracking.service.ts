import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import { productClicks } from '../../database/schema';

export interface RecordClickParams {
  tenantId: string;
  productId: string;
  marketplaceLinkId: string;
  ipHash?: string;
  userAgent?: string;
}

@Injectable()
export class ClickTrackingService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async recordClick(params: RecordClickParams) {
    await this.db.insert(productClicks).values(params);
  }
}
