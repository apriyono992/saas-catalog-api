import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../../common/utils/postgres-error.util';
import { DomainsRepository } from './domains.repository';

@Injectable()
export class DomainsService {
  constructor(private readonly domainsRepository: DomainsRepository) {}

  listForTenant(tenantId: string | null) {
    this.assertTenantScoped(tenantId);
    return this.domainsRepository.findAllForTenant(tenantId);
  }

  async create(tenantId: string | null, hostname: string) {
    this.assertTenantScoped(tenantId);
    const normalizedHostname = hostname.trim().toLowerCase();

    try {
      return await this.domainsRepository.create(tenantId, normalizedHostname);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Hostname is already in use');
      }
      throw error;
    }
  }

  async remove(tenantId: string | null, id: string) {
    this.assertTenantScoped(tenantId);
    const deleted = await this.domainsRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundException('Domain not found');
    }
  }

  async verify(tenantId: string | null, id: string) {
    this.assertTenantScoped(tenantId);
    const verified = await this.domainsRepository.verify(id, tenantId);
    if (!verified) {
      throw new NotFoundException('Domain not found');
    }
    return verified;
  }

  private assertTenantScoped(
    tenantId: string | null,
  ): asserts tenantId is string {
    if (!tenantId) {
      throw new ForbiddenException(
        'This action requires a tenant-scoped account',
      );
    }
  }
}
