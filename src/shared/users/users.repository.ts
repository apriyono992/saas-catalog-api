import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.providers';
import type { Database } from '../../database/database.providers';
import { users } from '../../database/schema';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: and(eq(users.email, email), isNull(users.deletedAt)),
    });
  }

  findById(id: string) {
    return this.db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
    });
  }

  async updateEmail(id: string, email: string) {
    const [updated] = await this.db
      .update(users)
      .set({ email, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  updatePasswordHash(id: string, passwordHash: string) {
    return this.db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async create(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
  }) {
    const [created] = await this.db
      .insert(users)
      .values({ ...data, role: 'admin' })
      .returning();
    return created;
  }

  findAllAdmins(tenantId?: string) {
    return this.db.query.users.findMany({
      where: tenantId
        ? and(eq(users.role, 'admin'), eq(users.tenantId, tenantId), isNull(users.deletedAt))
        : and(eq(users.role, 'admin'), isNull(users.deletedAt)),
      orderBy: (user, { desc }) => [desc(user.createdAt)],
    });
  }

  async setActive(id: string, isActive: boolean) {
    const [updated] = await this.db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async softDelete(id: string) {
    const [updated] = await this.db
      .update(users)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
}
