import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { RefreshTokenRepository } from './refresh-token.repository';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    UsersModule,
    ActivityLogModule,
  ],
  providers: [AuthService, JwtStrategy, RefreshTokenRepository],
  exports: [AuthService],
})
export class AuthModule {}
