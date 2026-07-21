import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

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
