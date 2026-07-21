import { Module } from '@nestjs/common';
import { AuthModule } from '../../shared/auth/auth.module';
import { UsersModule } from '../../shared/users/users.module';
import { AuthController } from './auth/auth.controller';
import { ProfileController } from './profile/profile.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AuthController, ProfileController],
})
export class AdminModule {}
