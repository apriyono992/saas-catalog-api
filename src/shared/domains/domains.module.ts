import { Module } from '@nestjs/common';
import { DomainsRepository } from './domains.repository';
import { DomainsService } from './domains.service';

@Module({
  providers: [DomainsRepository, DomainsService],
  exports: [DomainsRepository, DomainsService],
})
export class DomainsModule {}
