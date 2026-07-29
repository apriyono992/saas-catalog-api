import { Module } from '@nestjs/common';
import { TenantsModule } from '../../../shared/tenants/tenants.module';
import { UsersModule } from '../../../shared/users/users.module';
import { PlatformTenantsController } from './tenants/tenants.controller';
import { PlatformUsersController } from './users/users.controller';

@Module({
  imports: [TenantsModule, UsersModule],
  controllers: [PlatformTenantsController, PlatformUsersController],
})
export class PlatformModule {}
