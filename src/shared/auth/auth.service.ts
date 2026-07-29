import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { AppConfig } from '../../config/configuration';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { UsersRepository } from '../users/users.repository';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenRepository } from './refresh-token.repository';
import { Role } from './role.type';
import { parseTtlToMs } from './ttl.util';

interface AuthenticatedUserRecord {
  id: string;
  tenantId: string | null;
  role: Role;
  isActive: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersRepository.findByEmail(
      email.trim().toLowerCase(),
    );
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.activityLogService.record({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'auth.login',
    });

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const record = await this.refreshTokenRepository.findValidByHash(tokenHash);
    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokenRepository.revoke(record.id);

    const user = await this.usersRepository.findById(record.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const record = await this.refreshTokenRepository.findValidByHash(tokenHash);
    if (!record) {
      return;
    }

    await this.refreshTokenRepository.revoke(record.id);

    const user = await this.usersRepository.findById(record.userId);
    if (user) {
      await this.activityLogService.record({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'auth.logout',
      });
    }
  }

  private async issueTokens(user: AuthenticatedUserRecord) {
    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('jwt.accessSecret', { infer: true }),
      expiresIn: this.configService.get('jwt.accessTtl', { infer: true }),
    });

    const refreshToken = randomBytes(64).toString('hex');
    const refreshTtl = this.configService.get('jwt.refreshTtl', {
      infer: true,
    });

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(Date.now() + parseTtlToMs(refreshTtl)),
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
