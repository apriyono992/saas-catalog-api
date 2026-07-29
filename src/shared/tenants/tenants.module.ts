import { Module } from '@nestjs/common';
import { TenantsRepository } from './tenants.repository';
import { TenantsService } from './tenants.service';

@Module({
  providers: [TenantsRepository, TenantsService],
  exports: [TenantsRepository, TenantsService],
})
export class TenantsModule {}
