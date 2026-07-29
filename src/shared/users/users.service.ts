import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { isUniqueViolation } from '../../common/utils/postgres-error.util';
import { TenantsService } from '../tenants/tenants.service';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly tenantsService: TenantsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toProfile(user);
  }

  async updateEmail(userId: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.usersRepository.findByEmail(normalizedEmail);
    if (existing && existing.id !== userId) {
      throw new ConflictException('Email already in use');
    }

    const updated = await this.usersRepository.updateEmail(
      userId,
      normalizedEmail,
    );
    return this.toProfile(updated);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await argon2.verify(
      user.passwordHash,
      currentPassword,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = (await argon2.hash(newPassword)) as string;
    await this.usersRepository.updatePasswordHash(userId, passwordHash);
  }

  // ---- Platform API (superadmin managing admins across tenants) ----

  async createAdmin(tenantId: string, email: string, password: string) {
    await this.tenantsService.findByIdOrThrow(tenantId);
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = (await argon2.hash(password)) as string;

    try {
      const created = await this.usersRepository.create({
        tenantId,
        email: normalizedEmail,
        passwordHash,
      });
      return this.toProfile(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  async findAllAdmins(tenantId?: string) {
    const admins = await this.usersRepository.findAllAdmins(tenantId);
    return admins.map((admin) => this.toProfile(admin));
  }

  async getAdminOrThrow(id: string) {
    return this.toProfile(await this.findAdminOrThrow(id));
  }

  async updateAdminEmail(id: string, email: string) {
    const admin = await this.findAdminOrThrow(id);
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.usersRepository.findByEmail(normalizedEmail);
    if (existing && existing.id !== admin.id) {
      throw new ConflictException('Email already in use');
    }

    const updated = await this.usersRepository.updateEmail(
      admin.id,
      normalizedEmail,
    );
    return this.toProfile(updated);
  }

  async disable(id: string) {
    await this.findAdminOrThrow(id);
    const updated = await this.usersRepository.setActive(id, false);
    return this.toProfile(updated);
  }

  /** role check hides superadmin accounts from this admin-management surface */
  private async findAdminOrThrow(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user || user.role !== 'admin') {
      throw new NotFoundException('Admin not found');
    }
    return user;
  }

  private toProfile(user: {
    id: string;
    tenantId: string | null;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const { id, tenantId, email, role, isActive, createdAt, updatedAt } = user;
    return { id, tenantId, email, role, isActive, createdAt, updatedAt };
  }
}
