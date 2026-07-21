import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import { refreshTokens } from '../../database/schema';

@Injectable()
export class RefreshTokenRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    const [created] = await this.db
      .insert(refreshTokens)
      .values(data)
      .returning();
    return created;
  }

  findValidByHash(tokenHash: string) {
    return this.db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    });
  }

  revoke(id: string) {
    return this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id));
  }
}
