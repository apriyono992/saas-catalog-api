import { Module } from '@nestjs/common';
import { AuthModule } from '../../shared/auth/auth.module';
import { DomainsModule } from '../../shared/domains/domains.module';
import { UsersModule } from '../../shared/users/users.module';
import { AuthController } from './auth/auth.controller';
import { DomainsController } from './domains/domains.controller';
import { ProfileController } from './profile/profile.controller';

@Module({
  imports: [AuthModule, UsersModule, DomainsModule],
  controllers: [AuthController, ProfileController, DomainsController],
})
export class AdminModule {}
